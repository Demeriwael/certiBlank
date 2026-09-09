// Only explicit code markup and known service names get treatment. All content
// remains React text; question-bank strings are never rendered as raw HTML.
const tokens = /(```[\s\S]*?```|`[^`\n]+`|\b(?:AWS (?:Lambda|IAM|KMS|CloudTrail|Organizations|CloudFormation|Config|Budgets|Well-Architected Tool)|Amazon (?:EC2|S3|RDS|DynamoDB|CloudFront|VPC|SQS|SNS|ECS|EKS)|Microsoft Entra ID|Azure (?:Functions|Monitor|Policy|Key Vault|Blob Storage)))/g;
export function TechnicalText({ text }: { text: string }) {
  return <>{text.split(tokens).map((part, index) => {
    if (part.startsWith("```")) return <code className="qx-code-block" key={index}>{part.slice(3, -3).replace(/^\w*\n/, "").trim()}</code>;
    if (part.startsWith("`")) return <code className="qx-term" key={index}>{part.slice(1, -1)}</code>;
    return index % 2 === 1 ? <span className="qx-term" key={index}>{part}</span> : part;
  })}</>;
}

