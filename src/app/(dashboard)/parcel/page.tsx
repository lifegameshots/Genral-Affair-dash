import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { claimParcel } from '@/modules/parcel/actions'
import { formatDate } from '@/lib/utils'
import { PackageOpen } from 'lucide-react'

export default async function ParcelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: pendingParcels }, { data: claimedParcels }] = await Promise.all([
    supabase
      .from('parcels')
      .select('id, recipient_name, carrier, tracking_number, storage_location, status, created_at, reminder_count')
      .eq('recipient_id', user.id)
      .in('status', ['stored', 'notified'])
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('parcels')
      .select('id, recipient_name, carrier, tracking_number, storage_location, status, claimed_at, created_at')
      .eq('recipient_id', user.id)
      .eq('status', 'claimed')
      .order('claimed_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <PackageOpen className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">택배</h1>
      </div>

      {/* Pending parcels */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">미수령 택배</h2>
        {(pendingParcels ?? []).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <PackageOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">미수령 택배가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingParcels!.map((parcel) => (
              <Card key={parcel.id} className={parcel.status === 'notified' ? 'border-amber-200 bg-amber-50/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {parcel.carrier ?? '택배'}
                        </span>
                        <Badge variant={parcel.status === 'notified' ? 'warning' : 'info'}>
                          {parcel.status === 'notified' ? '알림 발송' : '보관중'}
                        </Badge>
                      </div>
                      {parcel.tracking_number && (
                        <div className="text-xs text-gray-400 font-mono">{parcel.tracking_number}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        보관 위치: <span className="font-medium text-gray-700">{parcel.storage_location}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatDate(parcel.created_at)} 도착</div>
                    </div>
                    <form action={async () => { 'use server'; await claimParcel(parcel.id) }}>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        수령 확인
                      </button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Claimed history */}
      {(claimedParcels ?? []).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">수령 이력</h2>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {claimedParcels!.map((parcel) => (
                  <div key={parcel.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm text-gray-700">{parcel.carrier ?? '택배'}</div>
                      <div className="text-xs text-gray-400">{formatDate(parcel.created_at)} 도착</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">수령완료</Badge>
                      <span className="text-xs text-gray-400">{parcel.claimed_at ? formatDate(parcel.claimed_at) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
