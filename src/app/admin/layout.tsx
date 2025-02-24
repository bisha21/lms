import Dashboard from "@/_component/Dashboard";

function AdminLayout({children}:Readonly<{children:React.ReactNode}>)
{
    return(
        <>
        <Dashboard>
            {children}
        </Dashboard>
        </>
    )
}
export default AdminLayout;