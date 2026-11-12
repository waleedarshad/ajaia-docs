import Link from "next/link";

export default function NotFound() {
  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1>Document not found</h1>
        <p className="muted" style={{ margin: 0 }}>
          It may have been deleted, or you may not have access to it.
        </p>
        <Link href="/" className="btn btn-primary" style={{ justifyContent: "center" }}>
          Back to your documents
        </Link>
      </div>
    </div>
  );
}
