import { jsx as _jsx } from "react/jsx-runtime";
import AdminDashboard from '../components/admin/AdminDashboard';
import PageWrapper from '../components/ui/PageWrapper';
const AdminDashboardPage = () => {
    return (_jsx(PageWrapper, { children: _jsx(AdminDashboard, {}) }));
};
export default AdminDashboardPage;
