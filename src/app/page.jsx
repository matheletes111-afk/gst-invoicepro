'use client';
import { useState, useEffect } from 'react';
import {
    TrendingUp,
    ShieldCheck,
    FileText,
    Calculator,
    BarChart,
    Clock,
    Users,
    CheckCircle,
    ArrowRight,
    Sparkles,
    Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { getUserFromTokenClient } from '@/lib/authClient';

export default function Home() {
    const router = useRouter();
    const [scrollY, setScrollY] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!getUserFromTokenClient());
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleRequestDemo = () => {
        router.push('/login');
    };

    const features = [
        {
            icon: <ShieldCheck className="w-6 h-6" />,
            title: "GST Invoicing Made Simple",
            description: "Generate GST-compliant invoices without accounting complexity.",
            color: "from-gray-800 to-gray-900"
        },
        {
            icon: <Calculator className="w-6 h-6" />,
            title: "100% GST Ready",
            description: "DRC-aligned invoices with accurate GST computation for taxable and exempt items.",
            color: "from-gray-800 to-gray-900"
        },
        {
            icon: <FileText className="w-6 h-6" />,
            title: "Simple by Design",
            description: "First-time users friendly. No prior system experience required.",
            color: "from-gray-800 to-gray-900"
        },
        {
            icon: <BarChart className="w-6 h-6" />,
            title: "Local Support",
            description: "Training & assistance built around Bhutan GST rules issued by DRC.",
            color: "from-gray-800 to-gray-900"
        }
    ];

    const stats = [
        { value: "Built for", label: "Bhutan" },
        { value: "100%", label: "GST Ready" },
        { value: "Simple", label: "by Design" },
        { value: "Local", label: "Support" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-orange-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
            </div>

            {/* Navigation - WHITE HEADER ONLY */}
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
                        <Link href="/pricing" className="text-gray-700 hover:text-orange-500 transition font-medium">Pricing Plan</Link>
                        <a href="#features" className="text-gray-700 hover:text-orange-500 transition font-medium">Features</a>
                        <a href="#how-it-works" className="text-gray-700 hover:text-orange-500 transition font-medium">How It Works</a>
                        <a href="#contact" className="text-gray-700 hover:text-orange-500 transition font-medium">Contact</a>
                        {isLoggedIn ? (
                            <Link href="/dashboard" className="text-gray-700 hover:text-orange-500 transition font-medium">Dashboard</Link>
                        ) : (
                            <Link href="/login" className="text-gray-700 hover:text-orange-500 transition font-medium">Login</Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section - REST IS SAME AS BEFORE */}
            <main className="relative z-10">
                <section className="pt-20 pb-16 px-6">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center"
                        >
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
                                <Sparkles className="w-4 h-4 mr-2 text-orange-500" />
                                <span className="text-base font-medium text-orange-500">
                                    Designed for Bhutan GST Compliance
                                </span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                                <span className="text-white">
                                    Prepare for GST in Bhutan
                                </span>
                                <br />
                                <span className="text-orange-500">
                                    The Simple Way
                                </span>
                            </h1>

                            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
                                All-in-one GST compliance platform with automated filing, real-time tracking,
                                and intelligent insights designed specifically for Bhutan businesses.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                                <button
                                    // onClick={handleRequestDemo} 
                                    className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
                                    Request Demo
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Stats Section - Gradient White Cards with Orange/Dark Blue Text */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-xl p-8 text-center shadow-2xl hover:shadow-orange-200/30 transition-shadow duration-300 border border-gray-200"
                                >
                                    <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-gray-800">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Features Grid */}
                        <div id="features" className="mb-20">
                            <h2 className="text-4xl font-bold text-center mb-12 text-white">
                                Why Choose <span className="text-orange-500">iTaxPro</span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                        className={`bg-gradient-to-br ${feature.color} rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-700`}
                                    >
                                        <div className="bg-orange-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                                            <div className="text-orange-500">
                                                {feature.icon}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                                        <p className="text-base text-gray-300">{feature.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <section id="contact" className="mb-20">
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-8 md:p-12 mb-20 border border-gray-700">
                                <div className="relative z-10 text-center">
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                        Ready to Prepare for GST in Bhutan?
                                    </h2>
                                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                                        Avoid last-minute stress and compliance risks. Start your GST journey with a simple and reliable system.
                                    </p>

                                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                                        <button
                                            //  onClick={handleRequestDemo} 
                                            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300">
                                            Request Demo
                                        </button>

                                        <button
                                            // onClick={handleRequestDemo} 
                                            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 border border-gray-600">
                                            Contact for Onboarding
                                        </button>
                                    </div>

                                    {/* Onboarding Contact Information */}
                                    <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 max-w-2xl mx-auto">
                                        <h3 className="text-xl font-bold text-white mb-4">Get in Touch for Onboarding</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-gray-400 text-sm font-semibold mb-2">Phone Numbers</p>
                                                <p className="text-white text-lg font-medium">17557676 & 17270844</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm font-semibold mb-2">Email</p>
                                                <a href="mailto:info@itechnologies.bt" className="text-orange-500 hover:text-orange-400 text-lg font-medium transition-colors">
                                                    info@itechnologies.bt
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Animated elements */}
                                <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
                            </div>
                        </section>

                        {/* Bottom Links */}
                        <div className="text-center space-y-4">
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <button
                                    // onClick={handleRequestDemo}
                                    className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 border border-gray-600 px-8 py-4"
                                >
                                    Talk to Our Team
                                </button>

                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300"
                                >
                                    View Pricing Plans
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
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