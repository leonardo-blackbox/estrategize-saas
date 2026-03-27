import { Link } from 'react-router-dom';
import { cn } from '../../../../lib/cn.ts';
import type { CourseCardData } from '../../formacao.types';
import { EntitlementBadge } from '../FormacaoEntitlementBadge';

export function FormacaoCourseCard({ course }: { course: CourseCardData }) {
  const isBlocked = course.status === 'locked' || course.status === 'drip';
  return (
    <div className="w-[45vw] sm:w-auto shrink-0 snap-center sm:snap-align-none">
      <Link
        to={isBlocked ? '#' : `/formacao/curso/${course.id}`}
        className={cn(
          'relative block rounded-[16px] overflow-hidden aspect-[2/3]',
          'group outline-none focus-visible:ring-2 focus-visible:ring-white',
          'bg-[var(--color-bg-elevated)]',
          isBlocked
            ? 'cursor-not-allowed'
            : 'cursor-pointer motion-safe:hover:-translate-y-1 transition-transform duration-300',
        )}
        onClick={isBlocked ? (e) => e.preventDefault() : undefined}
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover motion-safe:group-hover:scale-[1.05] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1e] to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        {isBlocked && <div className="absolute inset-0 bg-black/50" />}
        <div className="absolute top-2.5 right-2.5 z-10">
          <EntitlementBadge
            status={course.status}
            requiredOffer={course.requiredOffer}
            dripDate={course.dripDate}
            expiryDate={course.expiryDate}
            offerBadgeText={course.offerBadgeText}
          />
        </div>
        {isBlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
          </div>
        )}
        {isBlocked && course.salesUrl && (
          <a
            href={course.salesUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 right-3 z-20 inline-flex items-center justify-center rounded-full bg-white/90 text-black text-[12px] font-bold py-1.5 hover:bg-white transition-colors"
          >
            Comprar
          </a>
        )}
        <div className={cn('absolute left-0 right-0 z-10 p-3', isBlocked && course.salesUrl ? 'bottom-10' : 'bottom-0')}>
          <h3 className="text-[13px] font-semibold leading-tight text-white line-clamp-2 mb-0.5">
            {course.title}
          </h3>
          <p className="text-[11px] text-white/55">{course.lessons} aulas</p>
        </div>
      </Link>
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="w-[45vw] sm:w-auto shrink-0 snap-center sm:snap-align-none">
      <div className="aspect-[2/3] rounded-[16px] animate-pulse bg-[var(--color-bg-secondary)]" />
    </div>
  );
}
