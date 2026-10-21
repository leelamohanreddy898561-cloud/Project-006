import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Placeholder } from "./pages/Placeholder";

export default function App() {
  return (
    <>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/blog"
            element={
              <Placeholder
                title="Blogs"
                description="The full post list with search, topic, and tag filters arrives with R2."
              />
            }
          />
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
          <Route
            path="/signin"
            element={
              <Placeholder
                title="Sign In"
                description="Email and Google sign-in, powered by the Firebase Auth integration that is already wired up."
              />
            }
          />
          <Route
            path="/signup"
            element={
              <Placeholder
                title="Sign Up"
                description="Account creation with Firebase Auth — arriving in a later increment."
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
    </>
  );
}
