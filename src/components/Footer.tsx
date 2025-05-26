import React from 'react'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <i className="fas fa-dumbbell text-blue-600 text-2xl"></i>
              <span className="font-['Poppins',sans-serif] font-bold text-xl">BeanBuilt AI</span>
            </div>
            <p className="text-gray-600 text-sm">Your personal AI fitness assistant to help you achieve your health and fitness goals.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Workout Tracking</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Nutrition Planning</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Goal Setting</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Progress Analytics</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Exercise Library</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Nutrition Guide</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Workout Plans</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Community Forum</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">About Us</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Contact</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors cursor-pointer">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">© 2025 BeanBuilt AI. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 