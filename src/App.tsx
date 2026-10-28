import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { Home } from "./pages/Home";
import { AuthPage } from "./pages/AuthPage";
import { BlogList } from "./pages/BlogList";
import { Admin } from "./pages/Admin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AddBlog } from "./pages/AddBlog";
import { RequireAdmin } from "./components/RequireAdmin";
import { PostDetail } from "./pages/PostDetail";
import { Placeholder } from "./pages/Placeholder";
import { WorkspaceHome } from "./pages/WorkspaceHome";
import { WorkspaceLayout } from "./pages/WorkspaceLayout";
import {
  WorkspaceAdmin,
  WorkspaceAdminComposer,
  WorkspaceAdminGate,
} from "./pages/WorkspaceAdmin";
import { Dashboard } from "./pages/Dashboard";
import {
  AdminOverview,
  AdminSectionMissing,
  AdminUsers,
} from "./components/admin/AdminPanels";
import { ManageBlogs } from "./components/admin/ManageBlogs";

export default function App() {
  return (
    <>
      <Header />
      {/* R40 — every navigation starts at the top of the new page. */}
      <ScrollToTop />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog/:slug" element={<PostDetail />} />
          <Route path="/blog" element={<BlogList />} />
          {/* R43 — a tenant site: /w/<slug> resolves the workspace, and its
              children show that site's posts only. The layout renders the
              not-found and unavailable states for an unknown slug. */}
          <Route path="/w/:siteSlug" element={<WorkspaceLayout />}>
            <Route index element={<WorkspaceHome />} />
            <Route path="blog" element={<BlogList />} />
            <Route path="blog/:slug" element={<PostDetail />} />
          </Route>
          {/* R44 — the launcher, and a workspace's admin. The admin gate is the
              workspace role; R45 lets the platform admin in as well. */}
          <Route path="/dashboard" element={<Dashboard />} />
          {/* R45 — one gate for the site admin family: the list and the
              composer share the resolved workspace and the same access check. */}
          <Route path="/w/:siteSlug/admin" element={<WorkspaceAdminGate />}>
            <Route index element={<WorkspaceAdmin />} />
            <Route path="new" element={<WorkspaceAdminComposer />} />
          </Route>
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
          {/* R33 — the composer that writes to Firestore. It reuses the R31
              guard rather than redefining it, and sits beside the R32 dashboard
              because /admin/add-blog is a page of its own, not a dashboard
              section. R39 — the dashboard's "Add New Blog" section renders this
              same page element (below), so there is one composer and not two. */}
          <Route
            path="/admin/add-blog"
            element={
              <RequireAdmin>
                <AddBlog />
              </RequireAdmin>
            }
          />
          {/* R32 — the admin workspace. One guard for the whole family: the
              shell renders the sidebar, and each child is the panel for the
              section on screen. An unknown section gets a real panel, not a
              blank one. */}
          <Route
            path="/admin/dashboard"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminOverview />} />
            {/* R38 — the management view. R32.1 keeps the sidebar at three
                items, so this is the All Blogs section rather than a fourth. */}
            <Route path="blogs" element={<ManageBlogs />} />
            <Route path="blogs/new" element={<AddBlog />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="*" element={<AdminSectionMissing />} />
          </Route>
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
