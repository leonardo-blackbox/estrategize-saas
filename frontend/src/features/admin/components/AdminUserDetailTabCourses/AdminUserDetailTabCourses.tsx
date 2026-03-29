import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/Button.tsx';
import {
  adminGrantEntitlement,
  adminRevokeEntitlement,
  adminGetUserProgress,
  adminListCourses,
} from '../../services/admin.api.ts';
import { GrantEntitlementModal } from './GrantEntitlementModal.tsx';
import { EntitlementRow } from './EntitlementRow.tsx';
import { EnrollmentRow } from './EnrollmentRow.tsx';

interface TabCoursesProps {
  detail: any;
  userId: string;
}

export function AdminUserDetailTabCourses({ detail, userId }: TabCoursesProps) {
  const qc = useQueryClient();
  const [showGrantModal, setShowGrantModal] = useState(false);

  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: adminListCourses,
  });

  const { data: progressData } = useQuery({
    queryKey: ['admin-user-progress', userId],
    queryFn: () => adminGetUserProgress(userId),
  });

  const grantMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminGrantEntitlement>[1]) =>
      adminGrantEntitlement(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      setShowGrantModal(false);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (entitlementId: string) => adminRevokeEntitlement(userId, entitlementId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user', userId] }),
  });

  const courses = Array.isArray(coursesData) ? coursesData : [];
  const progress = (progressData as any)?.progress ?? [];
  const entitlements: any[] = detail.entitlements ?? [];
  const enrollments: any[] = detail.enrollments ?? [];

  return (
    <>
      <div className="space-y-6">
        {/* Entitlements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Entitlements ({entitlements.length})
            </h3>
            <Button size="sm" onClick={() => setShowGrantModal(true)}>+ Entitlement</Button>
          </div>
          {entitlements.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">Sem entitlements.</p>
          ) : (
            <div className="space-y-2">
              {entitlements.map((ent) => (
                <EntitlementRow
                  key={ent.id}
                  entitlement={ent}
                  onRevoke={(id) => revokeMutation.mutate(id)}
                  isRevoking={revokeMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Enrollments */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Matriculas ({enrollments.length})
          </h3>
          {enrollments.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">Sem matriculas.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((enr) => (
                <EnrollmentRow
                  key={enr.id}
                  enrollment={enr}
                  progress={progress.find((p: any) => p.course_id === enr.course_id) ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <GrantEntitlementModal
        open={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        onGrant={(data) => grantMutation.mutate(data)}
        isPending={grantMutation.isPending}
        courses={courses}
      />
    </>
  );
}
