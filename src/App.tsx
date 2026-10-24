import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { AuthPage } from "./pages/AuthPage";
import { BlogList } from "./pages/BlogList";
import { Admin } from "./pages/Admin";
import { RequireAdmin } from "./components/RequireAdmin";
import { PostDetail } from "./pages/PostDetail";
import { Placeholder } from "./pages/Placeholder";

export default function App() {
  return (
    <>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog/:slug" element={<PostDetail />} />
          <Route path="/blog" element={<BlogList />} />
          <Route
            path="/topics"
            element={
              <Placeholder
                title="Topics"
                description="Every topic with its post count arrives with R4."
              />
            }
          />
          <Route
            path="/about"
            element={
              <Placeholder
                title="About"
                description="Who writes AI Pulse and what it covers arrives with R7."
              />
            }
          />
          <Route path="/signin" element={<AuthPage mode="signin" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route
            path="/privacy"
            element={
              <Placeholder
                title="Privacy Policy"
                description="The full privacy policy is being prepared. Until it is published, this site stores no personal data beyond what your browser keeps locally."
              />
            }
          />
          <Route
            path="/terms"
            element={
              <Placeholder
                title="Terms of Use"
                description="The full terms of use are being prepared and will be published before any account feature goes live."
              />
            }
          />
          <Route
            path="*"
            element={
              <Placeholder
                title="Page not found"
                description="That page does not exist. Head back home and try again."
              />
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
