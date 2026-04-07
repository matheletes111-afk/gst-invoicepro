'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getUserFromTokenClient } from '@/lib/authClient';

export default function PricingPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!getUserFromTokenClient());
    }, []);
    const plans = [
        {
            title: "Basic Plan",
            subtitle: "For Small Businesses & Startups",
            price: "Nu. 1,000",
            period: "/ month",
            optionalFiling: "Nu. 1,500 / month",
            features: [
                "Up to 100 invoices per month",
                "Up to 2 users",
                "Single business location",
                "GST-compliant invoicing",
                "B2B & B2C invoices",
                "Credit & debit notes",
                "Basic GST reports",
                "Limited invoice branding",
                "5 GB data storage",
                "Email & phone support"
            ],
            description: "Ideal for small traders, shops and service providers starting with GST.",
            highlight: false
        },
        {
            title: "Enterprise Plan",
            subtitle: "For Medium & Large Businesses",
            price: "Nu. 1,500",
            period: "/ month",
            optionalFiling: "Nu. 3,500 / month", // ADDED: Missing optional filing support
            features: [
                "Unlimited / high-volume invoicing",
                "Up to 15 users",
                "Multiple branches / locations",
                "GST-compliant invoicing",
                "B2B & B2C invoices",
                "Advanced GST reports & analytics",
                "Bulk invoice upload",
                "Full invoice branding",
                "Role based access control",
                "20 GB data storage",
                "Priority phone & email support",
                "Dedicated account manager"
            ],
            description: "",
            highlight: true
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-orange-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
            </div>

            {/* Navigation - SAME WHITE HEADER AS HOME PAGE */}
            <nav className="relative z-10 py-0 px-4 bg-white border-b border-gray-200 shadow-sm flex items-center">
                <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <img
                            src="/logo.jpeg"
                            alt="iTaxPro"
                            className="h-14 w-auto object-contain block"
                        />
                        <span className="text-xl font-bold text-orange-500">iTaxPro</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-700 hover:text-orange-500 transition font-medium">Home</Link>
                        <a href="/#features" className="text-gray-700 hover:text-orange-500 transition font-medium">Features</a>
                        <a href="/#how-it-works" className="text-gray-700 hover:text-orange-500 transition font-medium">How It Works</a>
                        <a href="/#contact" className="text-gray-700 hover:text-orange-500 transition font-medium">Contact</a>
                        {isLoggedIn ? (
                            <Link href="/dashboard" className="text-gray-700 hover:text-orange-500 transition font-medium">Dashboard</Link>
                        ) : (
                            <Link href="/login" className="text-gray-700 hover:text-orange-500 transition font-medium">Login</Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 pt-20 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
                            <Sparkles className="w-4 h-4 mr-2 text-orange-500" />
                            <span className="text-base font-medium text-orange-500">
                                Simple. Transparent. Built for Bhutan GST.
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            <span className="text-white">Pricing &</span>{' '}
                            <span className="text-orange-500">Plans</span>
                        </h1>

                        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
                            Choose a plan that fits your business size and invoicing needs.
                            All plans are designed to ensure GST compliance as per DRC regulations.
                        </p>
                    </motion.div>

                    {/* One-Time Setup - Updated to match screenshot style */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center">
                            <span className="text-orange-500">One-Time Setup</span> (Applicable to All Plans)
                        </h2>
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        Installation & Onboarding <span className="text-orange-500">Nu. 15,000</span>
                                    </h3>
                                    <p className="text-gray-400 text-base mb-4">
                                        (one-time, non-refundable)
                                    </p>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                                        <span className="text-gray-300">System installation & configuration</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                                        <span className="text-gray-300">GST setup assistance</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                                        <span className="text-gray-300">User training & onboarding</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Plans */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`rounded-3xl p-8 ${plan.highlight ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500' : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'}`}
                            >
                                <div className="mb-8">
                                    <h3 className="text-3xl font-bold text-white mb-2">{plan.title}</h3>
                                    <p className="text-gray-400">{plan.subtitle}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline mb-2">
                                        <span className="text-5xl font-bold text-orange-500">{plan.price}</span>
                                        <span className="text-xl text-gray-400 ml-2">{plan.period}</span>
                                    </div>
                                    {plan.optionalFiling && (
                                        <div className="mt-4">
                                            <p className="text-gray-400 text-base">Optional <span className="text-orange-500">GST Filing Support:</span></p>
                                            <p className="text-2xl font-bold text-orange-500">{plan.optionalFiling}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-8">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <CheckCircle className="w-5 h-5 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                                                <span className="text-base text-gray-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {plan.description && (
                                    <div className="mb-8 p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                                        <p className="text-orange-500 font-medium">{plan.description}</p>
                                    </div>
                                )}

                                <button className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300">
                                    Choose Plan
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    {/* GST Filing Support */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 mb-12">
                            <h3 className="text-3xl font-bold text-white mb-6 text-center">
                                GST Filing Support <span className="text-orange-500">(Optional Add On)</span>
                            </h3>
                            <p className="text-gray-300 text-lg text-center mb-8">
                                We'll help you choose the right plan based on:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-800/50 rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-orange-500 mb-2">Invoice</div>
                                    <div className="text-xl font-bold text-white">volume</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-orange-500 mb-2">Business</div>
                                    <div className="text-xl font-bold text-white">size</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-orange-500 mb-2">Compliance</div>
                                    <div className="text-xl font-bold text-white">needs</div>
                                </div>
                            </div>
                            <div className="text-center">
                                <button className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 inline-flex items-center">
                                    Talk to Our Team
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Compliance Note */}
                        <div className="text-center text-gray-400 text-base">
                            <p>Compliance Note: iTaxPro is designed in alignment with GST requirements.</p>
                            <p className="mt-1 italic">*Excluded by Department of Revenue and customs (DRC)*</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-700 bg-gray-900/90 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="text-center text-gray-400">
                        <p>{`© ${new Date().getFullYear()},`} iTaxPro, All rights reserved.</p>
                        <p className="text-base mt-2">Developed by iTechnologies Pvt Ltd, Bhutan</p>
                        <p className="text-base mt-1">Aligned with Bhutan GST regulations issued by DRC</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}