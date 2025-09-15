import { Outlet } from 'react-router-dom';
import Topbar from '@/components/organisms/Sidebar';

const Layout = () => {
	return (
		<div className="min-h-screen bg-gray-100 flex flex-col">
			<Topbar />
			<main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pt-16">
				<div className="container mx-auto px-6 py-8">
					<Outlet />
				</div>
			</main>
		</div>
	);
};

export default Layout; 