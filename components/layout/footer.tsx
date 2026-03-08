export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-card/50 backdrop-blur-sm px-2 md:px-4 lg:px-6 py-2 mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs lg:text-sm text-muted-foreground max-w-[1500px] mx-auto w-full">
        <div>
          &copy; {currentYear} Hotel Web Management. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
}
