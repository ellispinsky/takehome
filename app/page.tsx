import { UploadForm } from "@/components/upload-form";

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center font-sans">
      <main className="flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            Label Application Review
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Upload a single PDF application or process a batch for compliance review.
          </p>
        </div>
        <UploadForm />
      </main>
    </div>
  );
}
