'use client';

import { useEffect, useRef } from 'react';
import { MobileModalProps } from '@/types/mobile';

/**
 * 移动端弹窗基础组件
 *
 * 功能：
 * - 全屏/半屏抽屉式弹窗
 * - 从底部滑入动画
 * - 支持下拉关闭
 * - 背景遮罩点击关闭
 * - 防止滚动穿透
 * - 自定义头部和内容
 */
export default function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'full',
  showCloseButton = true,
  headerActions,
  preventBackdropClose = false,
}: MobileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  // 防止滚动穿透
  useEffect(() => {
    if (isOpen) {
      // 禁用body滚动
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // 恢复body滚动
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    const content = contentRef.current;
    if (!content) return;

    // 只在内容区域顶部时允许下拉关闭
    if (content.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === 0) return;

    const content = contentRef.current;
    if (!content) return;

    currentYRef.current = e.touches[0].clientY;
    const deltaY = currentYRef.current - startYRef.current;

    // 只允许向下拉（deltaY > 0）
    if (deltaY > 0 && content.scrollTop === 0) {
      content.style.transform = `translateY(${deltaY}px)`;
      content.style.transition = 'none';
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    const content = contentRef.current;
    if (!content) return;

    const deltaY = currentYRef.current - startYRef.current;

    // 如果下拉距离超过100px，关闭弹窗
    if (deltaY > 100) {
      onClose();
    } else {
      // 否则回弹
      content.style.transform = '';
      content.style.transition = 'transform 0.3s ease-out';
    }

    // 重置
    startYRef.current = 0;
    currentYRef.current = 0;
  };

  // 背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (preventBackdropClose) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // 获取弹窗高度类
  const getSizeClass = () => {
    switch (size) {
      case 'full':
        return 'h-full rounded-t-none';
      case 'large':
        return 'h-[90vh] rounded-t-2xl';
      case 'medium':
        return 'h-[75vh] rounded-t-2xl';
      case 'small':
        return 'h-[50vh] rounded-t-2xl';
      default:
        return 'h-full rounded-t-none';
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        className={`w-full bg-white ${getSizeClass()} flex flex-col animate-slide-up overflow-hidden`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部下拉指示器（仅非全屏时显示） */}
        {size !== 'full' && (
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
        )}

        {/* 头部 */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            {/* 标题 */}
            <h2 className="text-lg font-bold text-gray-900 truncate flex-1 mr-2">
              {title}
            </h2>

            {/* 自定义操作按钮 */}
            {headerActions && (
              <div className="flex items-center gap-2 mr-2">
                {headerActions}
              </div>
            )}

            {/* 关闭按钮 */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 hover:text-red-500 transition-colors"
              >
                <span className="text-xl font-bold">×</span>
              </button>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
