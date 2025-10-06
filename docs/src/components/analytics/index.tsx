// import { UmamiScript } from './UmamiAnalytics'
// import { GAScript } from './GoogleAnalytics'
// import { fetchGlobalData } from '@/data/fetch-globals'
// import Script from 'next/script'

// let isProduction = process.env.NODE_ENV === 'production'

// export async function Analytics({ lang }: { lang: string }) {
//   const data = await fetchGlobalData({ locale: lang, params: { slug: 'default' } })

//   if (isProduction) {
//     return (
//       <>
//         {/* {globals.baidu_analytics_id && <BaiduAnalyticsScript />} */}
//         {data.globalData?.umami_analytics_id && (
//           <UmamiScript
//             id={data.globalData.umami_analytics_id}
//             src={data.globalData.umami_script_url || ''}
//           />
//         )}
//         {data.globalData?.google_analytics_id && (
//           <Script
//             src={`https://www.googletagmanager.com/gtag/js?id=${data.globalData.google_analytics_id}`}
//             strategy='afterInteractive'
//           />
//         )}
//         {data.globalData?.google_analytics_id && (
//           <Script id='google-analytics' strategy='afterInteractive'>
//             {`
//               window.dataLayer = window.dataLayer || [];
//               function gtag(){dataLayer.push(arguments);}
//               gtag('js', new Date());
//               gtag('config', '${data.globalData.google_analytics_id}');
//             `}
//           </Script>
//         )}
//       </>
//     )
//   }
//   return null
// }
