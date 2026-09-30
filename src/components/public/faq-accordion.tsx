"use client"

import { useId, useState } from "react"
import { IconChevronDown } from "@tabler/icons-react"

type Faq = {
  question: string
  text: string
}

function FaqItem({ question, text }: Faq) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const questionId = `${id}-question`
  const answerId = `${id}-answer`

  return (
    <div className="faq-item" data-open={open}>
      <button
        id={questionId}
        type="button"
        className="faq-question"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{question}</span>
        <IconChevronDown size={18} aria-hidden="true" />
      </button>
      <section
        id={answerId}
        className="faq-panel"
        data-open={open}
        aria-labelledby={questionId}
        aria-hidden={!open}
      >
        <div className="faq-panel-inner">
          <p className="faq-answer">{text}</p>
        </div>
      </section>
    </div>
  )
}

export function FaqAccordion({ items }: { items: readonly Faq[] }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <FaqItem key={item.question} {...item} />
      ))}
    </div>
  )
}
