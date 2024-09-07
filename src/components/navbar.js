import React from 'react';
import { auth } from '../firebase';

function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-xl">XORA Music</div>
        <div>
          {auth.currentUser ? (
            <button 
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => auth.signOut()}
            >
              Sign Out
            </button>
          ) : (
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;