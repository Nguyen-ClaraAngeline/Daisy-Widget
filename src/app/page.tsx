import Script from "next/script";

export default function Page() {
  return (
    <main>
      <h1>Site hôte de test (CSS hostile)</h1>
      <div id="daisy-booking" data-studio="std_pk_7f2a9c" data-api="/api/mock/v1" />
      <Script src="/widget.js" strategy="afterInteractive" />
    </main>
  );
}