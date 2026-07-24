#!/usr/bin/env python3
"""Parse NMC CBT PDF — extracts questions and yellow-highlighted answers."""

import json
import re
import sys
from pathlib import Path

import fitz


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


def get_highlighted_letters(page):
    """Return set of option letters (a-d) highlighted on this page."""
    yellow_rects = [
        p["rect"] for p in page.get_drawings() if is_yellow_fill(p.get("fill"))
    ]
    letters = set()
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                bbox = fitz.Rect(span["bbox"])
                if not re.match(r"^[a-d]\)$", text):
                    continue
                for yr in yellow_rects:
                    if rects_overlap(yr, bbox):
                        letters.add(text[0])
                        break
    return letters


def parse_questions_from_text(text, page_highlights, start_id=1):
    """Parse question blocks from page text, assign answers from highlights."""
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)

    parts = re.split(r"(?<=\n)(?=\d+\.\s)", text)
    questions = []
    q_id = start_id

    for part in parts:
        part = part.strip()
        if not part:
            continue
        m = re.match(r"^(\d+)\.\s*(.*)", part, re.DOTALL)
        if not m:
            continue

        qnum = int(m.group(1))
        body = m.group(2).strip()

        option_pattern = re.compile(r"(?:^|\n)([a-d])\)\s*", re.MULTILINE)
        splits = list(option_pattern.finditer(body))
        if not splits:
            continue

        question_text = body[: splits[0].start()].strip()
        question_text = re.sub(r"\s+", " ", question_text)

        options = []
        answer = None
        for i, match in enumerate(splits):
            letter = match.group(1)
            start = match.end()
            end = splits[i + 1].start() if i + 1 < len(splits) else len(body)
            opt_text = body[start:end].strip()
            opt_text = re.sub(r"\s+", " ", opt_text)
            options.append({"id": letter, "text": opt_text})
            if letter in page_highlights:
                answer = letter

        if not question_text or not options or qnum < 1:
            continue
        if len(question_text) < 10:
            continue

        questions.append(
            {
                "id": qnum,
                "question": question_text,
                "options": options,
                "answer": answer,
            }
        )
        q_id = qnum + 1

    return questions


def parse_pdf(pdf_path: str) -> list[dict]:
    doc = fitz.open(pdf_path)
    all_questions = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text") or ""
        if not re.search(r"\d+\.\s", text):
            continue

        highlights = get_highlighted_letters(page)
        page_questions = parse_questions_from_text(text, highlights)
        all_questions.extend(page_questions)

    doc.close()

    # Deduplicate by id (some questions may appear twice in PDF)
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

    with_answer = sum(1 for q in questions if q["answer"])
    without_answer = [q["id"] for q in questions if not q["answer"]]

    output = {
        "meta": {
            "title": "NMC CBT Practice Questions",
            "total": len(questions),
            "withAnswers": with_answer,
        },
        "questions": questions,
    }

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Extracted {len(questions)} questions ({with_answer} with answers)")
    if without_answer:
        print(f"Missing answers for {len(without_answer)} questions: {without_answer[:20]}...")
    print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()
