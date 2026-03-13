'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuthStore } from '@/store/auth';
import QRCode from 'qrcode';
import { registrationsApi } from '../api';


export function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || '');

  // Get selected tenant from auth store
  const selectedTenant = useAuthStore((state) => state.selectedTenant);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isLoadingCameras, setIsLoadingCameras] = useState(false);

  const [checkinMode, setCheckinMode] = useState<'camera' | 'hardware'>('camera');
  const [hardwareValue, setHardwareValue] = useState('');
  const hardwareInputRef = useRef<HTMLInputElement>(null);

  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeDivRef = useRef<HTMLDivElement>(null);

  // Function to generate QR code and open print dialog
  const printWelcomeCard = async (qrCodeText: string) => {
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeText, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create print content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nexpo Welcome Card</title>
          <style>
            @page {
              size: 72mm 106mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 6mm;
              font-family: 'Arial', sans-serif;
              width: 60mm;
              height: 94mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: white;
              box-sizing: border-box;
            }
            .welcome-text {
              font-size: 12px;
              font-weight: bold;
              color: #1f2937;
              text-align: center;
              margin-bottom: 6mm;
              line-height: 1.2;
            }
            .qr-code {
              width: 25mm;
              height: 25mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="welcome-text">Chào mừng bạn đến với Nexpo</div>
          <div class="qr-code">
            <img src="${qrCodeDataUrl}" alt="QR Code" />
          </div>
        </body>
        </html>
      `;

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            // Close the window after printing
            setTimeout(() => {
              printWindow.close();
            }, 1000);
          }, 500);
        };
      }
    } catch (error) {
      console.error('Error generating QR code for print:', error);
      toast.error('Failed to generate print content');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(console.error);
        qrCodeScannerRef.current.clear();
      }
    };
  }, []);

  // Load available cameras
  const loadAvailableCameras = async () => {
    try {
      setIsLoadingCameras(true);
      console.log('Loading available cameras...');

      // Request camera permission first
      await navigator.mediaDevices.getUserMedia({ video: true });

      // Get all video input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log('Available cameras:', videoDevices);
      setAvailableCameras(videoDevices);

      // Auto-select camera if only one available
      if (videoDevices.length === 1) {
        setSelectedCameraId(videoDevices[0].deviceId);
        console.log('Auto-selected single camera:', videoDevices[0].label);
      } else if (videoDevices.length > 1) {
        // Prefer back camera if available
        const backCamera = videoDevices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        );
        if (backCamera) {
          setSelectedCameraId(backCamera.deviceId);
          console.log('Auto-selected back camera:', backCamera.label);
        } else {
          // Use first camera as default
          setSelectedCameraId(videoDevices[0].deviceId);
          console.log('Auto-selected first camera:', videoDevices[0].label);
        }
      }

      toast.success(`Found ${videoDevices.length} camera(s)`);

    } catch (error) {
      console.error('Error loading cameras:', error);
      toast.error('Unable to access cameras. Please check permissions.');
    } finally {
      setIsLoadingCameras(false);
    }
  };

  // Auto-initialize scanner when element is ready
  useEffect(() => {
    if (checkinMode === 'camera' && isScanning && !qrCodeScannerRef.current) {
      const initializeWhenReady = async () => {
        const element = document.getElementById('qr-reader');
        if (element) {
          console.log('Element found, initializing scanner...');
          await initializeQRScanner();
        } else {
          console.log('Element not found, retrying in 100ms...');
          setTimeout(initializeWhenReady, 100);
        }
      };
      initializeWhenReady();
    }
  }, [isScanning, checkinMode]);

  // Auto-focus hardware input in hardware mode
  useEffect(() => {
    if (checkinMode === 'hardware' && !isProcessing) {
      const timer = setInterval(() => {
        hardwareInputRef.current?.focus();
      }, 500);
      return () => clearInterval(timer);
    }
  }, [checkinMode, isProcessing]);

  const handleHardwareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hardwareValue.trim()) {
      processCheckin(hardwareValue.trim());
      setHardwareValue('');
    }
  };

  // Initialize QR scanner with html5-qrcode
  const initializeQRScanner = async () => {
    try {
      console.log('Initializing QR scanner...');

      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) {
        console.error('QR reader element still not found');
        return;
      }

      if (!selectedCameraId) {
        toast.error('No camera selected. Please load cameras first.');
        return;
      }

      // Clear any existing scanner
      if (qrCodeScannerRef.current) {
        await qrCodeScannerRef.current.stop();
        qrCodeScannerRef.current.clear();
        qrCodeScannerRef.current = null;
      }

      // Create new QR scanner instance
      const qrScanner = new Html5Qrcode("qr-reader");

      // Start scanning with specific camera
      await qrScanner.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // @ts-ignore - html5-qrcode types might be outdated
          showTorchButtonIfSupported: true,
          // @ts-ignore
          showZoomSliderIfSupported: true,
          // @ts-ignore
          defaultZoomValueIfSupported: 2,
          // @ts-ignore
          useBarCodeDetectorIfSupported: true,
        },
        (decodedText) => {
          console.log('QR Code detected:', decodedText);
          // Process the checkin
          qrScanner.pause();
          processCheckin(decodedText);
          
          // Resume scanning for next scan
          setTimeout(() => {
            qrScanner.resume();
          }, 1000);
        },
        (error) => {
          // Silently handle scan errors (QR code not found)
          console.debug('QR scan error:', error);
        }
      );

      qrCodeScannerRef.current = qrScanner;
      setCameraPermission(true);
      toast.success('QR Scanner started successfully!');

    } catch (error) {
      console.error('Error initializing QR scanner:', error);
      setCameraPermission(false);
      toast.error('Unable to start QR scanner. Please check camera permissions.');
    }
  };

  // Initialize camera (just sets scanning state)
  const initializeCamera = async () => {
    console.log('Starting camera initialization...');
    setIsScanning(true);
  };

  // Stop camera
  const stopCamera = async () => {
    console.log('Stopping QR scanner...');

    if (qrCodeScannerRef.current) {
      try {
        await qrCodeScannerRef.current.stop();
        qrCodeScannerRef.current.clear();
        qrCodeScannerRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }

    setIsScanning(false);
    setCameraPermission(false);
    console.log('QR scanner stopped');
  };

  // Process checkin with bulk update
  const processCheckin = async (qrCodeId: string) => {
    // Don't process if already processing to prevent duplicate scans
    if (isProcessing) {
      console.log('[processCheckin] Already processing, ignoring duplicate scan');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[processCheckin] Starting bulk checkin:', { eventId, qrCodeId });

      // Get current tenant_id from auth store
      if (!selectedTenant?.id) {
        toast.error('No tenant selected. Please select a tenant first.');
        return;
      }

      const tenantId = selectedTenant.id;

      // Step 1: Get registration IDs that match the criteria
      const registrationsResult = await registrationsApi.getRegistrationIdsForCheckin(
        Number(eventId),
        tenantId,
        qrCodeId
      );

      if (!registrationsResult.success || !registrationsResult.data) {
        throw new Error('Failed to fetch registrations');
      }

      const matchingRegistrations = registrationsResult.data;

      if (matchingRegistrations.length === 0) {
        toast.error('No registrations found matching the QR code');
        return;
      }

      console.log(`[processCheckin] Found ${matchingRegistrations.length} registrations to check in`);

      // Step 2: Bulk update checkin_status to true
      const registrationIds = matchingRegistrations.map((reg: any) => reg.id);
      const bulkUpdateResult = await registrationsApi.bulkUpdateRegistrations(registrationIds, {
        checkin_status: true
      });

      if (!bulkUpdateResult.success) {
        throw new Error('Failed to update checkin status');
      }

      console.log('[processCheckin] Bulk update completed successfully');

      // Step 3: Show success message
      toast.success(`Successfully checked in ${matchingRegistrations.length} registration(s)!`);

      // Step 4: Print welcome card with QR code
      await printWelcomeCard(qrCodeId);

    } catch (error) {
      console.error('[processCheckin] Error:', error);
      toast.error('Check-in failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual checkin input
  const handleManualCheckin = () => {
    const registrationId = prompt('Enter Registration ID:');
    if (registrationId) {
      processCheckin(registrationId);
    }
  };


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg"
          >
            <Icon icon="lucide:qr-code" className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Event Check-in</h1>
          <p className="text-lg text-gray-600">Scan QR code or enter registration ID manually</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-md flex border border-gray-100">
            <button
              onClick={() => {
                setCheckinMode('camera');
                stopCamera();
              }}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                checkinMode === 'camera'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon icon="lucide:camera" className="w-4 h-4" />
              Scanner bằng Camera
            </button>
            <button
              onClick={() => {
                setCheckinMode('hardware');
                stopCamera();
              }}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                checkinMode === 'hardware'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon icon="lucide:zap" className="w-4 h-4" />
              Máy quét Cầm tay
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera/Scanner Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {checkinMode === 'camera' ? 'QR Code Scanner' : 'Máy quét Cầm tay'}
              </h2>
              <p className="text-gray-600">
                {checkinMode === 'camera' ? 'Position QR code within the frame' : 'Vui lòng quét mã từ máy cầm tay'}
              </p>
            </div>

            <div className="p-6">
              {!isScanning && checkinMode === 'camera' ? (
                <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center w-full p-6">
                    <Icon icon="lucide:qr-code" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">QR Scanner not active</p>

                    {/* Camera Selection */}
                    {availableCameras.length > 0 && (
                      <div className="mb-4 text-left">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Camera:
                        </label>
                        <select
                          value={selectedCameraId}
                          onChange={(e) => setSelectedCameraId(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {availableCameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button
                        onClick={loadAvailableCameras}
                        disabled={isLoadingCameras}
                        variant="outline"
                        className="w-full"
                      >
                        <Icon icon="lucide:camera" className="w-4 h-4 mr-2" />
                        {isLoadingCameras ? 'Loading Cameras...' : 'Load Cameras'}
                      </Button>

                      <Button
                        onClick={initializeCamera}
                        disabled={!selectedCameraId || availableCameras.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                      >
                        <Icon icon="lucide:play" className="w-4 h-4 mr-2" />
                        Start QR Scanner
                      </Button>

                      <Button
                        onClick={handleManualCheckin}
                        variant="outline"
                        className="w-full"
                      >
                        <Icon icon="lucide:keyboard" className="w-4 h-4 mr-2" />
                        Manual Entry
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {checkinMode === 'camera' ? (
                    <div className="aspect-square bg-black rounded-xl overflow-hidden relative">
                      {/* QR Scanner Container */}
                      <div
                        id="qr-reader"
                        ref={qrCodeDivRef}
                        className="w-full h-full"
                      />

                      {/* Custom overlay for better UX */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Corner brackets */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                        </div>

                        {/* Scanning line animation */}
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                          animate={{ y: [0, 192, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>

                      {/* Processing overlay */}
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl z-20">
                          <div className="bg-white rounded-lg p-6 text-center shadow-xl">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-700 font-medium">Processing scan...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square bg-blue-50 rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center p-8 text-center">
                      <div className="relative mb-6">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon icon="lucide:zap" className="w-12 h-12 text-blue-600" />
                        </div>
                        <motion.div 
                          className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Icon icon="lucide:check" className="w-3 h-3 text-white" />
                        </motion.div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-blue-900 mb-2">Sẵn sàng quét</h3>
                      <p className="text-blue-600 text-sm mb-6 leading-relaxed">
                        Hệ thống đã kết nối với máy quét cầm tay.<br/>
                        Vui lòng bấm nút trên máy quét để đọc mã QR.
                      </p>

                      <form onSubmit={handleHardwareSubmit} className="w-full max-w-xs">
                        <div className="relative">
                          <input
                            ref={hardwareInputRef}
                            type="text"
                            value={hardwareValue}
                            onChange={(e) => setHardwareValue(e.target.value)}
                            autoComplete="off"
                            placeholder="Dữ liệu sẽ xuất hiện đây..."
                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl shadow-sm text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {isProcessing && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                              <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
                            </div>
                          )}
                        </div>
                      </form>

                      <div className="mt-6 flex items-center gap-2 text-[11px] text-blue-400">
                        <Icon icon="lucide:info" className="w-3.5 h-3.5" />
                        Ô nhập liệu luôn tự động được chọn
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-2">
                    {checkinMode === 'camera' ? (
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        className="flex-1"
                      >
                        <Icon icon="lucide:stop" className="w-4 h-4 mr-2" />
                        Stop Scanner
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setCheckinMode('camera');
                          setIsScanning(false);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Icon icon="lucide:camera" className="w-4 h-4 mr-2" />
                        Dùng Camera
                      </Button>
                    )}
                    <Button
                      onClick={handleManualCheckin}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
                    >
                      <Icon icon="lucide:keyboard" className="w-4 h-4 mr-2" />
                      Manual Entry
                    </Button>
                  </div>

                  {/* Debug info */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-[10px] text-gray-500 grid grid-cols-2 gap-x-4 gap-y-1">
                    <p><strong>Status:</strong> {cameraPermission === null ? 'Idle' : cameraPermission ? 'Active' : 'Failed'}</p>
                    <p><strong>Scanning:</strong> {isScanning ? 'Yes' : 'No'}</p>
                    <p><strong>Cameras:</strong> {availableCameras.length}</p>
                    <p><strong>Mode:</strong> {checkinMode.toUpperCase()}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Status/Instructions Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Check-in</h3>
              <div className="space-y-4">
                {[
                  { step: '1', text: 'Chọn chế độ: Camera hoặc Máy quét cầm tay.' },
                  { step: '2', text: 'Nếu dùng Camera, hãy cấp quyền và đưa mã QR vào khung.' },
                  { step: '3', text: 'Nếu dùng Máy cầm tay, chỉ cần bấm nút quét trên thiết bị.' },
                  { step: '4', text: 'Hệ thống tự động xử lý và in thẻ chào mừng.' }
                ].map((item) => (
                  <div key={item.step} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">{item.step}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Lưu ý</h4>
                <div className="text-xs text-amber-700 space-y-1 leading-relaxed">
                  <p>• Chế độ máy cầm tay yêu cầu thiết bị hỗ trợ giả lập bàn phím.</p>
                  <p>• Để in thẻ, vui lòng cho phép trình duyệt mở cửa sổ pop-up.</p>
                  <p>• Nếu camera không hoạt động, hãy kiểm tra lại quyền truy cập.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={() => router.push(`/events/${eventId}`)}
            variant="ghost"
            className="text-gray-500 hover:text-blue-600"
          >
            <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
            Quay lại sự kiện
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
