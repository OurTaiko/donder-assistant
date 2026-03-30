import React from 'react';
import {
  Body1,
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem
} from '@fluentui/react-components';

function getDifficultyColor(difficulty) {
  const colors = {
    easy: '#cf202f',
    normal: '#4d7f2f',
    hard: '#005a9c',
    oni: '#8f1d4f',
    edit: '#5c2d91'
  };
  return colors[difficulty] || '#475467';
}

function getBranchColor(branchType) {
  const colors = {
    normal: '#667085',
    expert: '#0078d4',
    master: '#b42318'
  };
  return colors[branchType] || '#667085';
}

function ChartDetailPage({ detail, onBack }) {
  const statItems = detail?.stats ? [
    { label: '音符总数', value: detail.stats.totalNotes },
    { label: '平均间隔', value: `${detail.stats.avgGap} ms` },
    { label: '最小间隔', value: `${detail.stats.minGap} ms` }
  ] : [];

  return (
    <div className="results-panel chart-detail-panel">
      <header className="chart-detail-header" aria-label="谱面详情导航">
        <Breadcrumb className="list-breadcrumb" aria-label="谱面详情面包屑">
          <BreadcrumbItem>
            <BreadcrumbButton onClick={onBack}>谱面分析</BreadcrumbButton>
          </BreadcrumbItem>
          <BreadcrumbDivider />
          <BreadcrumbItem>
            <BreadcrumbButton className="chart-breadcrumb-song" current aria-current="page">
              <span className="chart-breadcrumb-song-text">{detail?.songName || '未知歌曲'}</span>
            </BreadcrumbButton>
          </BreadcrumbItem>
        </Breadcrumb>
      </header>

      <div className="chart-detail-body">
        {detail ? (
          <div className="chart-detail-grid">
            <section className="chart-detail-card chart-detail-stats-card" aria-label="谱面概要">
              <h3 className="chart-detail-card-title">谱面概要</h3>

              {(detail?.diffLabel || detail?.branchLabel || detail?.stats) ? (
                <div className="chart-detail-stats-grid">
                  {(detail?.diffLabel || detail?.level || detail?.branchLabel) && (
                    <>
                      <div className="chart-detail-stat-block chart-detail-basic-info">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '14px' }}>
                          <div style={{ color: getDifficultyColor(detail.difficulty), fontWeight: 700 }}>
                            {detail.diffLabel}
                          </div>
                          {detail.level && (
                            <div style={{ color: '#1f4f71' }}>
                              ★{detail.level}
                            </div>
                          )}
                          {detail.branchLabel && (
                            <div style={{ color: getBranchColor(detail.branchType), fontWeight: 600 }}>
                              {detail.branchLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  {statItems.map((item) => (
                    <div className="chart-detail-stat-block" key={item.label}>
                      <span className="chart-detail-stat-label">{item.label}</span>
                      <span className="chart-detail-stat-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Body1 className="hint">无可用的概要数据</Body1>
              )}
            </section>

            <section className="chart-detail-card chart-detail-gaps-card" aria-label="小节间隔明细">
              <h3 className="chart-detail-card-title">小节间隔明细</h3>
              {detail.bars.length ? (
                <div className="gap-list chart-gap-list">
                  {detail.bars.map((bar) => (
                    <div className="gap-bar" key={bar.label}>
                      <span className="gap-bar-label">{bar.label}</span>
                      <div className="gap-bar-values">
                        {bar.values.map((value, idx) => (
                          <span className={`gap-value ${value.className}`} key={`${bar.label}-${idx}`}>
                            {value.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Body1 className="hint">该谱面暂无可展示的小节间隔数据。</Body1>
              )}
            </section>
          </div>
        ) : (
          <div className="chart-detail-card chart-detail-empty">
            <Body1 className="hint">未找到对应谱面详情，请从列表重新进入。</Body1>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartDetailPage;
