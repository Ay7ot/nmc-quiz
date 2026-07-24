#!/usr/bin/env python3
"""Parse NMC CBT PDF — extracts questions and yellow-highlighted answers."""

import json
import re
import sys
from pathlib import Path

import fitz

OPTION_LINE = re.compile(r"^([a-z])\)\s*(.*)$", re.IGNORECASE)
QUESTION_LINE = re.compile(r"^(\d+)\.\s*(.*)$")
NEXT_QUESTION = re.compile(r"^\d+\.\s")


def is_yellow_fill(fill):
    if not fill or len(fill) < 3:
        return False
    r, g, b = fill[0], fill[1], fill[2]
    return r > 0.8 and g > 0.8 and b < 0.3


def rects_overlap(r1, r2, threshold=0.25):
    inter = r1 & r2
    if inter.is_empty:
        return False
    text_area = r2.width * r2.height
    if text_area <= 0:
        return False
    return (inter.width * inter.height) / text_area > threshold


def get_yellow_rects(page):
    return [p["rect"] for p in page.get_drawings() if is_yellow_fill(p.get("fill"))]


def span_highlighted(span_bbox, yellow_rects):
    return any(rects_overlap(yr, span_bbox) for yr in yellow_rects)


def get_page_lines(page):
    yellow_rects = get_yellow_rects(page)
    lines = []

    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text:
                continue
            bbox = fitz.Rect(line["bbox"])
            spans = []
            for s in line["spans"]:
                sb = fitz.Rect(s["bbox"])
                spans.append(
                    {
                        "text": s["text"],
                        "highlighted": span_highlighted(sb, yellow_rects),
                    }
                )
            lines.append(
                {
                    "text": text,
                    "y0": bbox.y0,
                    "y1": bbox.y1,
                    "highlighted": any(s["highlighted"] for s in spans),
                    "spans": spans,
                }
            )

    lines.sort(key=lambda row: (row["y0"], row["text"]))
    return lines


def split_question_blocks(lines):
    blocks = []
    current = None

    for line in lines:
        match = QUESTION_LINE.match(line["text"])
        if match:
            if current:
                blocks.append(current)
            current = {
                "id": int(match.group(1)),
                "lines": [line],
            }
            continue
        if current:
            current["lines"].append(line)

    if current:
        blocks.append(current)

    return blocks


def parse_question_block(block):
    lines = block["lines"]
    first = lines[0]["text"]
    first_match = QUESTION_LINE.match(first)
    if not first_match:
        return None

    question_parts = []
    if first_match.group(2).strip():
        question_parts.append(first_match.group(2).strip())

    body_lines = lines[1:]
    options = []
    current_opt = None
    options_started = False
    pending_text = None
    idx = 0

    while idx < len(body_lines):
        line = body_lines[idx]
        text = line["text"]
        if NEXT_QUESTION.match(text):
            break

        opt_match = OPTION_LINE.match(text)
        if opt_match:
            options_started = True
            if current_opt:
                options.append(current_opt)
            letter = opt_match.group(1).lower()
            rest = opt_match.group(2).strip()
            if pending_text:
                rest = f"{pending_text} {rest}".strip()
                pending_text = None
            current_opt = {
                "id": letter,
                "text": rest,
                "lines": [line],
            }
            idx += 1

            if not rest:
                while idx < len(body_lines):
                    nxt = body_lines[idx]["text"]
                    if NEXT_QUESTION.match(nxt) or OPTION_LINE.match(nxt):
                        break
                    current_opt["text"] = f"{current_opt['text']} {nxt}".strip()
                    current_opt["lines"].append(body_lines[idx])
                    idx += 1
            continue

        if not options_started:
            question_parts.append(text)
            idx += 1
            continue

        if current_opt is not None:
            if idx + 1 < len(body_lines):
                nxt_match = OPTION_LINE.match(body_lines[idx + 1]["text"])
                if nxt_match and not nxt_match.group(2).strip():
                    pending_text = text
                    options.append(current_opt)
                    current_opt = None
                    idx += 1
                    continue
            current_opt["text"] = f"{current_opt['text']} {text}".strip()
            current_opt["lines"].append(line)

        idx += 1

    if current_opt:
        options.append(current_opt)

    question_text = re.sub(r"\s+", " ", " ".join(question_parts)).strip()
    for opt in options:
        opt["text"] = re.sub(r"\s+", " ", opt["text"]).strip()

    if not question_text or not options:
        return None
    if len(question_text) < 10:
        return None

    answers = detect_highlighted_answers(options)
    answers = refine_extended_answers(options, answers)

    clean_options = [{"id": o["id"], "text": o["text"]} for o in options]

    return {
        "id": block["id"],
        "question": question_text,
        "options": clean_options,
        "answers": answers,
        "answer": answers[0] if len(answers) == 1 else None,
    }


def option_is_highlighted(opt) -> bool:
    for line in opt["lines"]:
        content_highlighted = False
        marker_highlighted = False
        for span in line["spans"]:
            token = span["text"].strip()
            if re.match(r"^[a-z]\)$", token, re.IGNORECASE):
                if span["highlighted"]:
                    marker_highlighted = True
            elif token and span["highlighted"]:
                content_highlighted = True
        if marker_highlighted or content_highlighted:
            return True
    return False


def detect_highlighted_answers(options):
    answers = []
    for opt in options:
        if option_is_highlighted(opt):
            answers.append(opt["id"])
    return answers


def refine_extended_answers(options, answers):
    option_ids = [o["id"] for o in options]
    max_letter = max(option_ids)

    # Standard 4-option questions — trust highlights as-is
    if max_letter <= "d":
        return answers

    # Extended lists (e.g. a–g multi-select): keep d+ only, fill gaps
    d_plus = [letter for letter in answers if letter >= "d" and letter in option_ids]
    if not d_plus:
        return answers

    alphabet = "abcdefghijklmnopqrstuvwxyz"
    min_i = min(alphabet.index(letter) for letter in d_plus)
    max_i = max(alphabet.index(letter) for letter in d_plus)
    filled = set(d_plus)
    for i in range(min_i, max_i + 1):
        letter = alphabet[i]
        if letter in option_ids and letter >= "d":
            filled.add(letter)

    return sorted(filled, key=lambda letter: option_ids.index(letter))


def parse_pdf(pdf_path: str) -> list[dict]:
    doc = fitz.open(pdf_path)
    all_questions = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        lines = get_page_lines(page)
        if not lines:
            continue

        for block in split_question_blocks(lines):
            parsed = parse_question_block(block)
            if parsed:
                all_questions.append(parsed)

    doc.close()

    seen = {}
    for q in all_questions:
        seen[q["id"]] = q

    return sorted(seen.values(), key=lambda q: q["id"])


def main():
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else str(
        Path.home() / "Downloads" / "1_000_QUESTIONS_WITH_ANSWERS_edited_.pdf"
    )
    out_path = sys.argv[2] if len(sys.argv) > 2 else str(
        Path(__file__).parent.parent / "src" / "data" / "questions.json"
    )

    print(f"Parsing {pdf_path}...")
    questions = parse_pdf(pdf_path)

    with_answers = sum(1 for q in questions if q.get("answers"))
    multi = sum(1 for q in questions if len(q.get("answers", [])) > 1)
    without_answer = [q["id"] for q in questions if not q.get("answers")]

    output = {
        "meta": {
            "title": "NMC CBT Practice Questions",
            "total": len(questions),
            "withAnswers": with_answers,
            "multiSelect": multi,
        },
        "questions": questions,
    }

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Extracted {len(questions)} questions ({with_answers} with answers, {multi} multi-select)")
    if without_answer:
        print(f"Missing answers for {len(without_answer)} questions: {without_answer[:20]}...")
    print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()
