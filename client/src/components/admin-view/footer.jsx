function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex h-14 items-center justify-center border-t border-slate-200/70 bg-white/80 px-4 text-xs text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400 lg:px-6">
      <div className="text-center">
        © {currentYear} cOOciDev Nedayar LMS Admin Experience. All rights reserved.
      </div>
    </footer>
  );
}

export default AdminFooter;
