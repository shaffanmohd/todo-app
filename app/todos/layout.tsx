import Navbar from "../components/Navbar";

export default function TodosLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  );
}
