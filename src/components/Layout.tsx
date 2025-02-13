import { Outlet, NavLink } from 'react-router-dom';
import { ListRestart as Restaurant, Receipt, Package, User, ChefHat } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 md:relative md:w-64 md:border-r md:border-t-0">
        <div className="flex justify-around md:flex-col md:h-full md:p-4">
          <NavLink
            to="/tables"
            className={({ isActive }) =>
              `flex items-center p-4 hover:text-red-500 ${isActive ? 'text-red-500' : 'text-gray-600'}`
            }
          >
            <Restaurant className="w-6 h-6" />
            <span className="hidden md:block ml-2">Tavoli</span>
          </NavLink>
          
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              `flex items-center p-4 hover:text-red-500 ${isActive ? 'text-red-500' : 'text-gray-600'}`
            }
          >
            <ChefHat className="w-6 h-6" />
            <span className="hidden md:block ml-2">Menu</span>
          </NavLink>
          
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex items-center p-4 hover:text-red-500 ${isActive ? 'text-red-500' : 'text-gray-600'}`
            }
          >
            <Receipt className="w-6 h-6" />
            <span className="hidden md:block ml-2">Ordini</span>
          </NavLink>
          
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `flex items-center p-4 hover:text-red-500 ${isActive ? 'text-red-500' : 'text-gray-600'}`
            }
          >
            <Package className="w-6 h-6" />
            <span className="hidden md:block ml-2">Magazzino</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center p-4 hover:text-red-500 ${isActive ? 'text-red-500' : 'text-gray-600'}`
            }
          >
            <User className="w-6 h-6" />
            <span className="hidden md:block ml-2">Profilo</span>
          </NavLink>
        </div>
      </nav>
      
      <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}