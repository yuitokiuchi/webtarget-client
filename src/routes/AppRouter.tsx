import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from '@/features/auth/Login';

function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<Login />} />
			</Routes>
		</BrowserRouter>
	);
}

export default AppRouter;
