'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { mockFeatures, mockTestimonials } from '../lib/data';

/**
 * Landing page with hero section, features, testimonials, and CTA
 */
export default function LandingPage() {
  useEffect(() => {
    // Initialize AOS animations
    const initAOS = async () => {
      const AOS = (await import('aos')).default;
      AOS.init({
        duration: 800,
        once: true,
        offset: 100,
      });
    };

    // Initialize feather icons
    const initFeather = async () => {
      const feather = (await import('feather-icons')).default;
      feather.replace();
    };

    initAOS();
    initFeather();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div data-aos="fade-right" className="text-white">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Connect with your{' '}
                <span className="text-yellow-300">perfect trainer</span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-gray-200">
                Find certified personal trainers, book sessions, and achieve your fitness goals with personalized programs designed just for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring text-center"
                >
                  Get Started
                </Link>
                <Link
                  href="/trainers"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-smooth focus-ring text-center"
                >
                  Browse Trainers
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div data-aos="fade-left" className="relative">
              <img
                src="https://picsum.photos/seed/hero/1200/630"
                alt="Personal trainer working with client"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex -space-x-2">
                    <img
                      src="https://i.pravatar.cc/200?img=1"
                      alt="Happy client"
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                    <img
                      src="https://i.pravatar.cc/200?img=2"
                      alt="Happy client"
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                    <img
                      src="https://i.pravatar.cc/200?img=3"
                      alt="Happy client"
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">500+ Happy Clients</p>
                    <div className="flex text-yellow-400">
                      {'★'.repeat(5)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FitConnect?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make fitness personal, accessible, and effective with our comprehensive platform designed for your success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mockFeatures.map((feature, index) => (
              <div
                key={feature.id}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="bg-white p-8 rounded-xl shadow-lg card-hover text-center"
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i data-feather={feature.icon} className="h-8 w-8 text-indigo-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real people who transformed their lives with FitConnect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="bg-white p-8 rounded-xl shadow-lg card-hover"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-4">
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div data-aos="fade-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Start Your Fitness Journey?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join thousands of people who have already transformed their lives with FitConnect.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring"
            >
              Start Your Fitness Journey
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}