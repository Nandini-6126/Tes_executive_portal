import { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  Lock,
  Clock,
  User
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * CTIDataPanel - Displays Customer/Technical Intelligence data
 * Only visible to Manager and Admin roles
 */
export default function CTIDataPanel({ 
  data = null, 
  resourceType = 'service',
  resourceId = null,
  isLoading = false 
}) {
  const { canReadCTI, canWriteCTI } = usePermissions();
  const [isRevealed, setIsRevealed] = useState(false);

  // Don't render if user doesn't have CTI access
  if (!canReadCTI) {
    return null;
  }

  // Mock CTI data if not provided
  const ctiData = data || {
    strategic_insights: "Key strategic positioning for Q2 expansion. Client shows strong interest in expanding cloud infrastructure services. Competitive advantage through proprietary AI integration.",
    managerial_notes: "Recommend allocating senior resources for Phase 2. Budget discussions scheduled for next month. Stakeholder alignment confirmed.",
    competitive_intel: "Primary competitor (TechServ Inc) has been underbidding by 15%. Our value proposition focuses on long-term ROI and dedicated support.",
    risk_assessment: "Medium risk - Client's internal restructuring may affect project timeline. Mitigation: Maintain close communication with new leadership.",
    classification: "confidential",
    created_by: "Sarah Wilson",
    updated_at: "2024-01-15T10:30:00Z",
  };

  const getClassificationBadge = (classification) => {
    const styles = {
      internal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      confidential: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      restricted: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[classification] || styles.internal;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="glass-card border-purple-500/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-purple-500/5 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              CTI Data
              <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getClassificationBadge(ctiData.classification)}`}>
                {ctiData.classification?.toUpperCase()}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Customer & Technical Intelligence</p>
          </div>
        </div>

        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Content
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Reveal Content
            </>
          )}
        </button>
      </div>

      {/* Security Warning */}
      <div className="px-6 py-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-400">
          This information is classified and access is being logged. Handle according to data protection policies.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {isRevealed ? (
          <>
            {/* Strategic Insights */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-white">Strategic Insights</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-6">
                {ctiData.strategic_insights}
              </p>
            </div>

            {/* Managerial Notes */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-white">Managerial Notes</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-6">
                {ctiData.managerial_notes}
              </p>
            </div>

            {/* Competitive Intelligence */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-white">Competitive Intelligence</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-6">
                {ctiData.competitive_intel}
              </p>
            </div>

            {/* Risk Assessment */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-white">Risk Assessment</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-6">
                {ctiData.risk_assessment}
              </p>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Last updated by {ctiData.created_by}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(ctiData.updated_at)}
                </span>
              </div>
              {canWriteCTI && (
                <button className="text-purple-400 hover:text-purple-300 transition-colors">
                  Edit CTI Data
                </button>
              )}
            </div>
          </>
        ) : (
          /* Hidden State */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">Content Hidden</h4>
            <p className="text-sm text-slate-400 max-w-sm">
              CTI data is hidden by default for security. Click "Reveal Content" to view strategic insights, managerial notes, and competitive intelligence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
