import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { useFormPublico } from '../../hooks/useFormPublico';
import { FormProgressBar } from '../FormProgressBar';
import { FormWelcomeStep } from '../FormWelcomeStep';
import { FormThankYouStep } from '../FormThankYouStep';
import { FormQuestionStep } from '../FormQuestionStep';
import { FormLoading } from '../FormLoading';
import { FormError } from '../FormError';

export function FormPublicoAggregator() {
  const form = useFormPublico();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isEmbedMode, isPreviewMode, viewportHeight, isTouchDevice,
    isLoading, isError, data, application, fields, theme, settings,
    currentIndex, currentField, answers, submitted, direction,
    validationError, redirectCountdown, collectibleFields, progress,
    questionNumber, isLastQuestion, welcomeField, submitMutation,
    handleSetAnswer, handleNext, handleBack, handleReset, handleWelcomeStart,
    setValidationError,
  } = form;

  const renderContent = () => {
    if (isLoading) return <FormLoading />;
    if (isError || !data) return <FormError message="Formulário não encontrado" />;
    if (submitted) {
      return <FormThankYouStep settings={settings} theme={theme} onReset={handleReset} redirectCountdown={redirectCountdown} />;
    }
    if (currentIndex === -1) {
      if (!welcomeField) {
        const hasRenderableFields = fields.some((f) => f.type !== 'welcome' && f.type !== 'thank_you');
        if (!hasRenderableFields) return <FormError message="Este formulário ainda não tem perguntas configuradas." />;
        return <FormLoading />;
      }
      return <FormWelcomeStep field={welcomeField} theme={theme} settings={settings} onStart={handleWelcomeStart} />;
    }
    if (!currentField) return <FormError message="Pergunta não encontrada." />;
    if (currentField.type === 'welcome') {
      return <FormWelcomeStep field={currentField} theme={theme} settings={settings} onStart={handleNext} />;
    }
    if (currentField.type === 'thank_you') {
      return <FormThankYouStep settings={settings} theme={theme} onReset={handleReset} redirectCountdown={redirectCountdown} />;
    }
    const fieldLogic = currentField.conditional_logic as unknown as Record<string, unknown>;
    const isMultipleChoice = currentField.type === 'multiple_choice';
    const allowMultiple = isMultipleChoice && Boolean(fieldLogic?.allowMultiple);
    const isAutoAdvance = isMultipleChoice && !allowMultiple;
    const buttonLabel = isMultipleChoice
      ? (fieldLogic?.buttonLabel as string | undefined)
      : (currentField.options as Record<string, unknown>)?.buttonLabel as string | undefined;

    return (
      <FormQuestionStep
        field={currentField}
        questionNumber={questionNumber}
        totalQuestions={collectibleFields.length}
        value={answers[currentField.id]}
        onChange={(v) => handleSetAnswer(currentField.id, v)}
        onNext={handleNext}
        onBack={handleBack}
        theme={theme}
        settings={settings}
        isLast={isLastQuestion}
        isMutating={submitMutation.isPending}
        direction={direction}
        validationError={validationError}
        onClearError={() => setValidationError(null)}
        isTouchDevice={isTouchDevice}
        buttonLabel={buttonLabel}
        onAutoAdvance={isAutoAdvance ? handleNext : undefined}
        hideOkButton={isAutoAdvance}
      />
    );
  };

  const bgStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: theme.backgroundColor,
    fontFamily: theme.fontFamily || 'Inter, sans-serif',
    overflow: 'hidden auto',
    height: isEmbedMode ? '100%' : `${viewportHeight}px`,
    paddingBottom: isEmbedMode ? 0 : 'env(safe-area-inset-bottom)',
    paddingTop: isEmbedMode ? 0 : 'env(safe-area-inset-top)',
  };

  if (theme.backgroundImageUrl) {
    Object.assign(bgStyle, {
      backgroundImage: `url(${theme.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    });
  }

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="pt-BR" />
        {application && (
          <>
            <title>{application.title} — Iris</title>
            <meta name="description" content={`Responda o formulário: ${application.title}`} />
            <meta property="og:title" content={application.title} />
            <meta property="og:description" content="Formulário criado com Iris" />
            {theme.logoUrl && <meta property="og:image" content={theme.logoUrl} />}
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
          </>
        )}
      </Helmet>
      <div ref={containerRef} style={bgStyle}>
        {isPreviewMode && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
            background: 'rgba(124,92,252,0.92)', backdropFilter: 'blur(8px)',
            padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.02em',
          }}>
            <span style={{ opacity: 0.8 }}>👁</span>
            MODO PRÉVIA — Rascunho não publicado. As respostas não serão salvas.
          </div>
        )}
        {theme.logoUrl && !submitted && currentIndex >= 0 && currentField?.type !== 'welcome' && currentField?.type !== 'thank_you' && (
          <div style={{ position: 'fixed', top: 20, left: 24, zIndex: 50, pointerEvents: 'none' }}>
            <img src={theme.logoUrl} alt="Logo" style={{ height: 32, objectFit: 'contain', maxWidth: 140 }} />
          </div>
        )}
        <FormProgressBar
          progress={progress}
          buttonColor={theme.buttonColor}
          visible={settings.showProgressBar && !submitted && currentIndex >= 0 && !isPreviewMode}
          currentQuestion={questionNumber > 0 ? questionNumber : undefined}
          totalQuestions={collectibleFields.length}
        />
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </HelmetProvider>
  );
}
