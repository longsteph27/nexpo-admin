'use client';

import './StepBlock.css';
import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import BlockContainer from '@/components/BlockContainer';
import TypographyTitle from '@/components/typography/TypographyTitle';
import TypographyHeadline from '@/components/typography/TypographyHeadline';
import TypographyProse from '@/components/typography/TypographyProse';
import { getDirectusMedia } from '@/lib/utils/directus-helpers';
import { isEven } from '@/lib/utils/math';
import type { BlockSteps } from '@/directus/types';

export interface BlockStepsData extends BlockSteps {}

interface StepsBlockProps {
  data: BlockSteps & {
    translations?: Array<{
      title?: string;
      headline?: string;
      languages_code: string;
    }>;
    steps?: Array<{
      id?: string;
      title?: string;
      content?: string;
      image?: string;
      translations?: Array<{
        title?: string;
        content?: string;
        languages_code: string;
      }>;
    }>;
  };
  lang: string;
}

export default function StepsBlock({ data, lang }: StepsBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN';
  const translations = Array.isArray(data.translations) ? data.translations : [];
  const translation =
    translations.find((item) => item.languages_code === directusLang) || translations[0];
  const title = translation?.title || data.title || '';
  const headline = translation?.headline || data.headline || '';

  // Sort steps by sort field to maintain order
  const steps = Array.isArray(data.steps)
    ? [...data.steps].sort((a, b) => (a?.sort ?? 0) - (b?.sort ?? 0))
    : [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bodyStyles = window.getComputedStyle(document.body);
      console.log('[StepsBlock] CSS Variables:');
      console.log('--color-primary:', bodyStyles.getPropertyValue('--color-primary'));
      console.log('--font-body:', bodyStyles.getPropertyValue('--font-body'));
      console.log('--font-display:', bodyStyles.getPropertyValue('--font-display'));
      console.log('--font-code:', bodyStyles.getPropertyValue('--font-code'));
    }
  }, []);

  return (
    <BlockContainer className="mx-auto max-w-4xl text-center">
      {title && (
        <TypographyTitle className="text-content-secondary font-font-display font-semibold">
          {title}
        </TypographyTitle>
      )}
      {headline && (
        <TypographyHeadline
          className="text-color-primary font-font-display font-semibold"
          size="xl"
          content={headline}
        />
      )}
      {steps.length > 0 && (
        <div className="mt-8">
          {steps.map((step, stepIndex) => {
            const stepTranslation =
              step?.translations?.find((item) => item.languages_code === directusLang) ||
              step?.translations?.[0];
            const stepTitle = stepTranslation?.title || step?.title || '';
            const stepContent = stepTranslation?.content || step?.content || '';

            // Determine image position based on setting and index
            const imagePosition = data.alternate_image_position
              ? (isEven(stepIndex) ? 'left' : 'right')
              : 'left';
            const isImageRight = imagePosition === 'right';

            return (
              <div key={step.id || stepIndex}>
                <motion.div
                  initial={{ opacity: 0, x: isImageRight ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: stepIndex * 0.1 }}
                  className={`relative p-6 border-2 border-color-primary rounded-xl md:flex md:space-x-8 ${
                    isImageRight ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {step?.image && (
                    <div className="flex-shrink-0">
                      <Image
                        className="h-32 w-full object-cover rounded-xl md:h-full md:w-48"
                        width={500}
                        height={500}
                        alt={stepTitle}
                        src={getDirectusMedia(step.image)}
                      />
                    </div>
                  )}

                  <div className={`mt-4 w-full text-left md:mt-0 ${step?.image ? 'md:flex-1' : ''}`}>
                    {data.show_step_numbers && (
                      <div className="font-font-body text-content-secondary font-semibold uppercase tracking-wide">
                        Step {stepIndex + 1}
                      </div>
                    )}
                    {stepTitle && (
                      <TypographyHeadline
                        content={stepTitle}
                        size="lg"
                        className="mt-2 font-font-display text-color-primary font-semibold"
                      />
                    )}
                    {stepContent && (
                      <TypographyProse content={stepContent} className="mt-4 font-font-body" />
                    )}
                  </div>
                </motion.div>

                {stepIndex !== steps.length - 1 && (
                  <svg className="steps-animation m-0 mx-auto h-16 stroke-current text-color-primary md:h-20" viewBox="0 0 60 200">
                    <line
                      className="path"
                      x1="15"
                      x2="15"
                      y1="0"
                      y2="200"
                      strokeWidth="8"
                      strokeLinecap="square"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </BlockContainer>
  );
}




