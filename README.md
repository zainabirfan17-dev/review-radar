# 📡 Review Radar

A lightweight, single-file web app that reads a customer review and classifies it as **positive (1)** or **negative (0)**. It also gives a **satisfaction percentage** and a short **remark**.

No frameworks, no build step, no dependencies. Just open the HTML file in a browser.

**[Live demo](https://YOUR-USERNAME.github.io/review-radar/)** <!-- replace after enabling GitHub Pages -->

<!-- Add a screenshot: ![Review Radar screenshot](screenshot.png) -->

## Features

- **Binary result:** shows `1` for positive reviews and `0` for negative ones
- **Satisfaction score:** a percentage from 0 to 100 with a progress bar
- **Remarks:** a one-line summary, from "Excellent" to "Very poor"
- **Negation handling:** "not good" is read as negative, not positive
- **Intensifiers:** words like "very" and "extremely" strengthen the sentiment
- **Fallback:** shows `–` instead of guessing when a review has no sentiment words
- **Animated radar** display
- **Light and dark mode:** follows your system theme
- **Responsive:** works on desktop and mobile

## Usage

1. Download or clone this repository.
2. Open `review-radar.html` in any modern browser. You can also use the **Live Server** extension in VS Code.
3. Paste a review into the text box and click **Scan review**.

### Example

| Review | Result | Satisfaction |
|---|---|---|
| "Absolutely loved it, great quality and fast delivery!" | 1 | High |
| "Terrible experience. Rude staff and the food was cold." | 0 | Low |
| "Not good at all, would not recommend." | 0 | Low |

## How it works

Review Radar uses a simple lexicon-based approach:

1. The review is lowercased and split into words.
2. Each word is matched against a list of positive and negative words (`POS` and `NEG`).
3. If a negation word (such as "not" or "never") appears within three words before a match, the word's meaning flips.
4. If an intensifier (such as "very" or "extremely") comes right before a match, its weight is multiplied by 1.5.
5. Exclamation marks add a small boost to the existing sentiment.
6. The final score is converted to a percentage with a logistic curve:

   ```
   satisfaction = 100 / (1 + e^(-0.8 × score))
   ```

A score above zero displays `1`, a score below zero displays `0`, and a score of exactly zero shows `–`.

### Satisfaction remarks

| Satisfaction | Remark |
|---|---|
| 90% and above | Excellent |
| 70–89% | Good |
| 50–69% | Leaning positive |
| 30–49% | Leaning negative |
| 10–29% | Poor |
| Below 10% | Very poor |

## Customization

Open `review-radar.html` and edit the script section:

- **`POS` / `NEG`:** add or remove words to tune what counts as positive or negative
- **`NEGATE` / `BOOST`:** change the negation and intensifier words
- **`run()`:** adjust the remark tiers or the percentage curve

## Limitations

This is a keyword-based classifier, not a machine learning model. It does not understand context, so it can be fooled by:

- Sarcasm ("Oh great, it broke on day one")
- Mixed reviews with strong positives and negatives
- Slang, typos, or words missing from the lists
- Languages other than English

Treat the satisfaction percentage as a rough estimate.

## Ideas for improvement

- Replace the word lists with a trained sentiment model
- Support batch scanning of many reviews from a CSV file
- Highlight the words that influenced the score
- Add more languages

## Tech stack

HTML, CSS and vanilla JavaScript in a single file.

