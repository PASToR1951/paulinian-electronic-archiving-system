import { client } from "../data/denopost_conn.ts";  // PostgreSQL connection file

export async function handleSidebar(req: Request): Promise<Response> {
    try {
        // Get user session (assuming session ID is in cookies)
        const cookies = req.headers.get("cookie") || "";
        const sessionToken = cookies.match(/session_token=([^;]+)/)?.[1];

        if (!sessionToken) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Fetch user role from session
        const result = await client.queryObject(`
            SELECT u.role 
            FROM credentials u 
            JOIN tokens t ON u.id = t.user_id 
            WHERE t.token = $1
        `, [sessionToken]);

        if (result.rowCount === 0) {
            return new Response("Invalid session", { status: 401 });
        }

        const userRole = result.rows[0].role;

        // Sidebar items based on role
        const sidebarItems = [
            { href: "/admin/dashboard.html", text: "Dashboard", icon: "layout-dashboard" },
            { href: "/admin/Components/documents_page.html", text: "Documents List", icon: "folders" },
            { href: "/admin/Components/admin_logs.html", text: "System Logs", icon: "logs", roles: ["admin"] },
            { href: "/admin/Components/add_author.html", text: "Add New Author", icon: "pencil-plus", roles: ["admin"] },
            { href: "/admin/Components/create_news.html", text: "Create News Article", icon: "news", roles: ["admin"] },
            { href: "/admin/Components/document_permissions.html", text: "Document Permissions", icon: "lock-access", roles: ["admin"] },
            { href: "/admin/profile.html", text: "Profile", icon: "settings" },
            { href: "/logout", text: "Logout", icon: "logout-2" }
        ];

        // Filter items based on role
        const filteredSidebar = sidebarItems.filter(item => !item.roles || item.roles.includes(userRole));

        return new Response(JSON.stringify(filteredSidebar), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error fetching sidebar:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
