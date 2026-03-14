import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">CoreInventory</h1>
        <p className="text-muted-foreground">Inventory Management System</p>
        <div className="flex gap-4 justify-center mt-6">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg border border-border bg-card font-medium hover:bg-muted"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
