import React, { useRef } from 'react';
import { Mail, Phone } from 'lucide-react'; 
import helloImage from '../assets/hello.jpg'; 
const Contact = () => {
  const contactRef = useRef(null);

  return (
    <div
      ref={contactRef}
      className="bg-gray-50 py-20  max-w-6xl mx-auto"
    >
      <div className="container px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <p className="text-green-600 text-sm mb-2">How can we help you?</p>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Contact us</h1>
          <p className="text-gray-700 mb-6 max-w-md">
            We’re here to help and answer any questions you might have. We look forward to hearing from you!
          </p>

          <div className="space-y-5">
            <div className="flex items-center">
              <Phone className="text-orange-500 mr-3" />
              <span className="text-gray-700">+91 7454061975</span>
            </div>
            <div className="flex items-center">
              <Mail className="text-orange-500 mr-3" />
              <span className="text-gray-700">githconnectx@gmail.com</span>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 flex justify-center">
          <img
            src={helloImage}
            alt="Contact Us"
            className="w-full max-w-md h-auto rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default Contact;
