import type { SVGProps } from "react"
const CreditCardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <rect x={2.5} y={4.167} width={15} height={11.667} rx={1.667} stroke="currentColor" strokeWidth={1.667} />
    <path stroke="currentColor" strokeWidth={1.667} d="M2.5 7.5h15" />
    <path stroke="currentColor" strokeLinecap="round" strokeWidth={1.667} d="M5.833 11.667h2.5" />
  </svg>
)
export default CreditCardIcon
