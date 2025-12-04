function InstructorFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="px-4 lg:px-6 h-14 flex items-center justify-center border-t bg-background text-muted-foreground">
      <div className="text-sm">
        © {currentYear} cOOciDev Nedayar LMS. تمامی حقوق محفوظ است.
      </div>
    </footer>
  );
}

export default InstructorFooter;