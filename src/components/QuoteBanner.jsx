import { todayKey } from '../lib/dates.js'
import { pickQuote } from '../lib/quotes.js'

export default function QuoteBanner() {
  const quote = pickQuote(todayKey())
  return (
    <aside className="quote">
      <p className="quote__text">“{quote.text}”</p>
      {quote.author && <p className="quote__author">— {quote.author}</p>}
    </aside>
  )
}
