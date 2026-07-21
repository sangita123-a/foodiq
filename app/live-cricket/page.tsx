import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveCricketView from "@/components/cricket/LiveCricketView";

export default function LiveCricketPage() {
  return (
    <main className="min-h-screen bg-footer text-foreground">
      <Navbar />
      <LiveCricketView />
      <Footer />
    </main>
  );
}
