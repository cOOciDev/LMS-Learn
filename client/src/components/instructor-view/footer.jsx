function InstructorFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="px-4 lg:px-6 h-14 flex items-center justify-center border-t bg-white">
      <div className="text-sm text-muted-foreground">
        © {currentYear} LMS Learn. All rights reserved.
      </div>
    </footer>
  );
}

export default InstructorFooter;

