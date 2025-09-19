'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'duchuu.dsgnr@gmail.com',
      password: '',
      rememberMe: false,
    },
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Check if form is valid for enabling/disabling login button
  const isFormValid = emailValue && 
    emailValue.includes('@') && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue) && 
    passwordValue && 
    passwordValue.length >= 6;

  // Validate email in real-time
  React.useEffect(() => {
    if (emailValue && emailValue.includes('@')) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
      if (isValidEmail) {
        setEmailValidation({
          isValid: true,
          message: 'You got right email',
        });
      } else {
        setEmailValidation({
          isValid: false,
          message: 'Please enter a valid email',
        });
      }
    } else {
      setEmailValidation(null);
    }
  }, [emailValue]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder for Google login
    console.log('Google login clicked');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-white flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8 space-y-8"
        >
          {/* <h1 className="text-4xl font-bold text-nexpo-blue mb-2"> */}
          <div className="flex justify-center items-center">
            <Image src="/logo_nexpo.png" alt="NEXPO" width={100} height={100} className="w-40 h-auto" />
          </div>
          {/* </h1> */}
          <p className="text-nexpo-gray font-bold text-md">Welcome back</p>
        </motion.div>

        {/* Google Login Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={handleGoogleLogin}
            className="w-full bg-nexpo-bg-gray hover:bg-gray-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-center gap-3 transition-colors duration-200"
        >
          <Image src="/google_icon.png" alt="Google" width={20} height={20} className="w-5 h-5" />
          <span className="text-nexpo-gray font-medium">Log in with google</span>
        </motion.button>

        {/* Separator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-nexpo-light-gray">or continue with</span>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-nexpo-gray mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-nexpo-blue focus:outline-none bg-transparent transition-colors duration-200"
              placeholder="Enter your email"
            />
            {emailValidation && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2"
              >
                <Icon
                  icon={emailValidation.isValid ? 'mdi:check-circle' : 'mdi:alert-circle'}
                  className={`w-4 h-4 ${emailValidation.isValid ? 'text-green-500' : 'text-red-500'}`}
                />
                <span
                  className={`text-sm ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                  {emailValidation.message}
                </span>
              </motion.div>
            )}
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-nexpo-gray mb-2">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-nexpo-blue focus:outline-none bg-transparent transition-colors duration-200"
              placeholder="Type password here"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-3">
            <input
              {...register('rememberMe')}
              type="checkbox"
              id="rememberMe"
              className="w-4 h-4 text-nexpo-blue border-gray-300 rounded focus:ring-nexpo-blue focus:ring-2"
            />
            <label htmlFor="rememberMe" className="text-sm text-nexpo-gray">
              Always sign in on this device
            </label>
          </div>

          {/* Login Button */}
          <motion.button
            whileHover={isFormValid && !isLoading ? { scale: 1.02 } : {}}
            whileTap={isFormValid && !isLoading ? { scale: 0.98 } : {}}
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              isLoading || !isFormValid
                ? 'bg-nexpo-bg-gray text-gray-500 cursor-not-allowed'
                : 'bg-nexpo-blue text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
                <span>Logging in...</span>
              </div>
            ) : (
              'Log in'
            )}
          </motion.button>
        </motion.form>

        {/* Forgot Password */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-6"
        >
          <button className="text-nexpo-gray hover:text-nexpo-blue text-sm transition-colors duration-200">
            Forgot your password?
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
