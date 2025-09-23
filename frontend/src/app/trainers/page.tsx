'use client';

import { useState, useEffect, useMemo } from 'react';
import { mockTrainers, Specialty, Availability } from '../../lib/data';
import TrainerCard from '../../components/Trainers/TrainerCard';
import Filters from '../../components/Trainers/Filters';
import Pagination from '../../components/Trainers/Pagination';

/**
 * Trainers page with filtering and pagination
 */
export default function TrainersPage() {
  const [trainers] = useState(mockTrainers);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | 'All'>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const trainersPerPage = 6;

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

  // Filter trainers based on selected filters
  const filteredTrainers = useMemo(() => {
    return trainers.filter(trainer => {
      const specialtyMatch = selectedSpecialty === 'All' || trainer.specialty === selectedSpecialty;
      const availabilityMatch = selectedAvailability === 'All' || trainer.availability.includes(selectedAvailability);
      return specialtyMatch && availabilityMatch;
    });
  }, [trainers, selectedSpecialty, selectedAvailability]);

  // Paginate filtered trainers
  const paginatedTrainers = useMemo(() => {
    const startIndex = (currentPage - 1) * trainersPerPage;
    const endIndex = startIndex + trainersPerPage;
    return filteredTrainers.slice(startIndex, endIndex);
  }, [filteredTrainers, currentPage, trainersPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredTrainers.length / trainersPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSpecialty, selectedAvailability]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Expert Trainers
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Connect with certified personal trainers who are passionate about helping you achieve your fitness goals. 
              Each trainer brings unique expertise and personalized approaches to your journey.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <i data-feather="zap" className="h-6 w-6 text-indigo-600"></i>
                <h3 className="text-lg font-semibold text-indigo-900">Smart Scheduling Available</h3>
              </div>
              <p className="text-indigo-700 text-sm">
                Our AI-powered algorithm helps you find the optimal training times that work perfectly with your schedule and your trainer's availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Filters
            selectedSpecialty={selectedSpecialty}
            selectedAvailability={selectedAvailability}
            onSpecialtyChange={setSelectedSpecialty}
            onAvailabilityChange={setSelectedAvailability}
          />
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredTrainers.length === 0 ? (
            <div className="text-center py-16">
              <i data-feather="search" className="h-16 w-16 text-gray-400 mx-auto mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No trainers found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-gray-600">
                  Showing {paginatedTrainers.length} of {filteredTrainers.length} trainers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedTrainers.map((trainer, index) => (
                  <div
                    key={trainer.id}
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                  >
                    <TrainerCard trainer={trainer} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div data-aos="fade-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Can't Find the Perfect Trainer?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              We're always adding new certified trainers to our platform. Contact us to learn more about our trainer network.
            </p>
            <button className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring">
              Contact Support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
