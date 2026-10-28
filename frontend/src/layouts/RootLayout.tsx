import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" closeButton />
    </>
  );
}
