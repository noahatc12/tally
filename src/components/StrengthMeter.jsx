export default function StrengthMeter({ value }) {
  return (
    <div className="strength">
      <div className="strength__bar">
        <div className="strength__fill" style={{ width: `${value}%` }} />
      </div>
      <span className="strength__label">
        strength <strong>{value}%</strong>
      </span>
    </div>
  )
}
