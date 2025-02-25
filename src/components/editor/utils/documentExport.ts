import { Editor } from '@tiptap/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, BorderStyle, ISectionOptions, IStylesOptions } from 'docx';

interface DocumentSection extends ISectionOptions {
  children: (Paragraph | DocxTable)[];
}

// 处理文本颜色转换
const processColor = (inputColor: string): string => {
  let color = inputColor;
  // 如果是 RGB 格式，转换为十六进制
  if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      color = '#' + rgb.slice(0, 3).map((x: string) => 
        parseInt(x).toString(16).padStart(2, '0')
      ).join('');
    }
  }
  // 移除 # 号
  color = color.replace('#', '');
  // 确保是6位十六进制
  if (color.length === 3) {
    color = color.split('').map((c: string) => c + c).join('');
  }
  // 确保颜色值是小写的
  return color.toLowerCase();
};

// 将十六进制颜色映射到 docx 支持的高亮颜色
const getHighlightColor = (hexColor: string): string => {
  // docx 支持的高亮颜色及其十六进制值
  const highlightColors: { [key: string]: string } = {
    'yellow': 'ffff00',
    'green': '00ff00',
    'cyan': '00ffff',
    'magenta': 'ff00ff',
    'blue': '0000ff',
    'red': 'ff0000',
    'darkBlue': '000080',
    'darkCyan': '008080',
    'darkGreen': '008000',
    'darkMagenta': '800080',
    'darkRed': '800000',
    'darkYellow': '808000',
    'darkGray': '808080',
    'lightGray': 'c0c0c0',
    'black': '000000'
  };

  // 精确的颜色映射表，基于编辑器中使用的颜色
  const exactColorMap: { [key: string]: string } = {
    // 黄色系
    'ffeb3b': 'yellow',  // 浅黄色
    'ffd700': 'yellow',  // 金色
    'ffdd00': 'yellow',  // 亮黄色
    'ffc107': 'yellow',  // 琥珀色
    
    // 橙色系
    'ffa500': 'darkYellow', // 橙色
    'ff7f50': 'darkYellow', // 珊瑚色
    'ff7e00': 'darkYellow', // 深橙色
    'ff9800': 'darkYellow', // 橙色
    
    // 红色系
    'ff0000': 'red',     // 红色
    'ff1717': 'red',     // 亮红色
    'f44336': 'red',     // 材料设计红色
    'ff1493': 'magenta', // 深粉色
    'c71585': 'darkMagenta', // 中紫红色
    
    // 绿色系
    '90ee90': 'green',   // 浅绿色
    '98fb98': 'green',   // 浅绿色
    '00fa9a': 'green',   // 中绿色
    '00ff00': 'green',   // 绿色
    '4caf50': 'green',   // 材料设计绿色
    '008000': 'darkGreen', // 深绿色
    
    // 青色系
    '00ffff': 'cyan',    // 青色
    '87ceeb': 'cyan',    // 天蓝色
    '2196f3': 'cyan',    // 材料设计蓝色
    '007fff': 'cyan',    // 蔚蓝色
    
    // 蓝色系
    '0000ff': 'blue',    // 蓝色
    '000080': 'darkBlue', // 海军蓝
    
    // 紫色系
    'e6e6fa': 'lightGray', // 淡紫色
    'dda0dd': 'magenta', // 梅红色
    'ee82ee': 'magenta', // 紫罗兰色
    'da70d6': 'magenta', // 兰花紫
    '7337ee': 'darkMagenta', // 深紫色
    'ee37d4': 'magenta', // 亮紫色
    
    // 粉色系
    'ffc0cb': 'magenta', // 粉红色
    
    // 棕色系
    'f0e68c': 'yellow',  // 卡其色
    'deb887': 'darkYellow', // 实木色
    'd2b48c': 'darkYellow', // 棕褐色
    'bc8f8f': 'darkYellow', // 玫瑰棕色
    '8b4513': 'darkRed',  // 马鞍棕色
    
    // 灰色系
    'f5f5f5': 'lightGray', // 白烟色
    'b7b7b7': 'lightGray', // 浅灰色
    '999999': 'darkGray',  // 中灰色
    '666666': 'darkGray',  // 深灰色
    '434343': 'darkGray',  // 更深的灰色
    '000000': 'black',     // 黑色
    
    // 特殊颜色处理
    '421421': 'darkRed',   // 橙红色
    '421422': 'darkRed',   // 橙红色
    '421423': 'darkRed',   // 橙红色
    '421424': 'darkRed',   // 橙红色
    '421425': 'darkRed',   // 橙红色
    '421426': 'darkRed',   // 橙红色
    '421427': 'darkRed',   // 橙红色
    '421428': 'darkRed',   // 橙红色
    '421429': 'darkRed',   // 橙红色
    '42142a': 'darkRed',   // 橙红色
    '42142b': 'darkRed',   // 橙红色
    '42142c': 'darkRed',   // 橙红色
    '42142d': 'darkRed',   // 橙红色
    '42142e': 'darkRed',   // 橙红色
    '42142f': 'darkRed',   // 橙红色
  };

  // 首先检查是否有精确匹配
  if (exactColorMap[hexColor]) {
    return exactColorMap[hexColor];
  }
  
  // 检查是否是特殊的橙红色（如截图中的 421421412）
  if (hexColor.startsWith('42142')) {
    return 'darkRed';
  }

  // 如果没有精确匹配，使用加权颜色距离计算最接近的颜色
  let minDistance = Infinity;
  let closestColor = 'yellow'; // 默认黄色

  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);

  // 计算颜色的亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // 计算颜色的饱和度
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  for (const [name, hex] of Object.entries(highlightColors)) {
    const r2 = parseInt(hex.slice(0, 2), 16);
    const g2 = parseInt(hex.slice(2, 4), 16);
    const b2 = parseInt(hex.slice(4, 6), 16);

    // 计算目标颜色的亮度
    const brightness2 = (r2 * 299 + g2 * 587 + b2 * 114) / 1000;
    
    // 计算目标颜色的饱和度
    const max2 = Math.max(r2, g2, b2);
    const min2 = Math.min(r2, g2, b2);
    const saturation2 = max2 === 0 ? 0 : (max2 - min2) / max2;

    // 使用加权欧几里得距离，考虑亮度和饱和度
    const colorDistance = Math.sqrt(
      Math.pow(r - r2, 2) * 0.3 + 
      Math.pow(g - g2, 2) * 0.59 + 
      Math.pow(b - b2, 2) * 0.11
    );
    
    const brightnessDistance = Math.abs(brightness - brightness2);
    const saturationDistance = Math.abs(saturation - saturation2);
    
    // 综合距离，给予颜色距离更高的权重
    const distance = colorDistance * 0.6 + brightnessDistance * 0.2 + saturationDistance * 0.2;

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = name;
    }
  }

  // 特殊处理：对于橙色系列，优先映射为 darkYellow
  if ((r > 200 && g > 100 && g < 200 && b < 100) && closestColor === 'yellow') {
    return 'darkYellow';
  }
  
  // 特殊处理：对于红色系列，确保不会映射为黄色
  if (r > 200 && g < 100 && b < 100 && closestColor === 'yellow') {
    return 'red';
  }
  
  // 特殊处理：对于橙红色系列（如截图中的 421421412）
  if (r >= 66 && r <= 70 && g >= 20 && g <= 24 && b >= 20 && b <= 24) {
    return 'darkRed';
  }

  return closestColor;
};

// 处理高亮标记
const processHighlight = (mark: any): string | null => {
  if (!mark || !mark.attrs || !mark.attrs.backgroundColor) {
    return null;
  }
  
  const color = processColor(mark.attrs.backgroundColor);
  if (!color) {
    return null;
  }
  
  const highlightColor = getHighlightColor(color);
  
  // 调试信息
  console.log(`高亮颜色映射: ${mark.attrs.backgroundColor} -> #${color} -> ${highlightColor}`);
  
  return highlightColor;
};

// 处理字体大小
const processFontSize = (mark: any): number | null => {
  if (!mark || !mark.attrs || !mark.attrs.fontSize) {
    return null;
  }
  
  let fontSize = mark.attrs.fontSize;
  
  // 如果是字符串，尝试提取数字部分
  if (typeof fontSize === 'string') {
    // 移除单位（如px, pt, em等）
    const sizeMatch = fontSize.match(/^(\d+(\.\d+)?)/);
    if (sizeMatch) {
      fontSize = parseFloat(sizeMatch[1]);
    } else {
      return null;
    }
  }
  
  // 将像素值转换为磅值（1pt = 1.33px）
  const sizeInPt = Math.round(fontSize / 1.33);
  
  // docx 使用 half-points，所以乘以2
  return sizeInPt * 2;
};

// 处理文本节点
const processTextRun = (child: any): TextRun => {
  if (child.type === 'text') {
    const textStyle: any = {
      text: child.text || '',
    };

    // 处理文本标记
    if (child.marks) {
      // 处理加粗
      if (child.marks.some((mark: any) => mark.type === 'bold')) {
        textStyle.bold = true;
      }

      // 处理斜体
      if (child.marks.some((mark: any) => mark.type === 'italic')) {
        textStyle.italics = true;
      }

      // 处理下划线
      if (child.marks.some((mark: any) => mark.type === 'underline')) {
        textStyle.underline = {};
      }

      // 处理删除线
      if (child.marks.some((mark: any) => mark.type === 'strike')) {
        textStyle.strike = true;
      }

      // 处理文本颜色
      const colorMark = child.marks.find((mark: any) => mark.type === 'textStyle' && mark.attrs.color);
      if (colorMark && colorMark.attrs.color) {
        const color = processColor(colorMark.attrs.color);
        if (color) {
          // 确保颜色值是有效的
          try {
            // 尝试解析颜色值
            const r = parseInt(color.slice(0, 2), 16);
            const g = parseInt(color.slice(2, 4), 16);
            const b = parseInt(color.slice(4, 6), 16);
            
            // 检查是否是有效的RGB值
            if (!isNaN(r) && !isNaN(g) && !isNaN(b) && 
                r >= 0 && r <= 255 && 
                g >= 0 && g <= 255 && 
                b >= 0 && b <= 255) {
              textStyle.color = color;
            } else {
              // 如果解析失败，使用默认黑色
              textStyle.color = '000000';
            }
          } catch (e) {
            // 如果出现异常，使用默认黑色
            textStyle.color = '000000';
          }
        }
      }

      // 处理背景色
      const textStyleMark = child.marks.find((mark: any) => mark.type === 'textStyle' && mark.attrs.backgroundColor);
      if (textStyleMark) {
        const highlightColor = processHighlight(textStyleMark);
        if (highlightColor) {
          textStyle.highlight = highlightColor;
          
          // 如果是浅色高亮，确保文本颜色足够深以保持可读性
          if (['yellow', 'green', 'cyan', 'lightGray'].includes(highlightColor) && !textStyle.color) {
            textStyle.color = '000000'; // 黑色文本
          }
          // 如果是深色高亮，确保文本颜色足够浅以保持可读性
          else if (['darkBlue', 'darkCyan', 'darkGreen', 'darkMagenta', 'darkRed', 'blue', 'black'].includes(highlightColor) && !textStyle.color) {
            textStyle.color = 'ffffff'; // 白色文本
          }
        }
      }

      // 处理字体大小
      const fontSizeMark = child.marks.find((mark: any) => mark.type === 'textStyle' && mark.attrs.fontSize);
      if (fontSizeMark) {
        const fontSize = processFontSize(fontSizeMark);
        if (fontSize) {
          textStyle.size = fontSize;
        }
      }
    }

    return new TextRun(textStyle);
  }
  return new TextRun({ text: '' });
};

// 处理节点
const processNode = (node: any): Paragraph | Paragraph[] | null => {
  if (node.type === 'paragraph') {
    return new Paragraph({
      children: node.content?.map(processTextRun) || [],
      style: node.attrs?.textAlign ? node.attrs.textAlign : undefined,
      spacing: {
        before: 200,
        after: 200
      }
    });
  } else if (node.type === 'heading') {
    const headingLevels = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6
    };
    return new Paragraph({
      children: node.content?.map(processTextRun) || [],
      heading: headingLevels[node.attrs.level as keyof typeof headingLevels],
      style: node.attrs?.textAlign ? node.attrs.textAlign : undefined,
    });
  } else if (node.type === 'bulletList') {
    return node.content?.map((item: any) => {
      const listItemContent = item.content?.[0]?.content?.map(processTextRun) || [];
      return new Paragraph({
        children: listItemContent,
        bullet: {
          level: 0
        },
        style: item.attrs?.textAlign ? item.attrs.textAlign : undefined,
        spacing: {
          before: 100,
          after: 100
        }
      });
    }) || [];
  } else if (node.type === 'orderedList') {
    return node.content?.map((item: any) => {
      const listItemContent = item.content?.[0]?.content?.map(processTextRun) || [];
      return new Paragraph({
        children: listItemContent,
        numbering: {
          reference: 'default-numbering',
          level: 0
        },
        style: item.attrs?.textAlign ? item.attrs.textAlign : undefined,
        spacing: {
          before: 100,
          after: 100
        }
      });
    }) || [];
  }
  return null;
};

// 导出文档为 DOCX
export const exportToDocx = async (editor: Editor, title: string, includeTitle: boolean = false): Promise<Blob> => {
  // 处理文档标题
  const documentTitle = title.trim() || '未命名文档';
  
  // 将编辑器内容转换为 docx 格式
  const content = editor.getJSON();
  const children: Paragraph[] = [];
  
  // 如果用户选择包含标题，则添加标题段落
  if (includeTitle) {
    children.push(
      new Paragraph({
        text: documentTitle,
        heading: HeadingLevel.HEADING_1,
        spacing: {
          after: 200
        }
      })
    );
  }

  // 处理所有节点
  content.content?.forEach((node: any) => {
    const processed = processNode(node);
    if (Array.isArray(processed)) {
      children.push(...processed);
    } else if (processed) {
      children.push(processed);
    }
  });

  // 创建文档
  const doc = new Document({
    title: documentTitle, // 设置文档属性中的标题
    styles: {
      default: {
        document: {
          run: {
            font: 'Microsoft YaHei',
            size: 24,
          },
          paragraph: {
            spacing: {
              line: 360,
            },
          },
        },
      },
    },
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{
          level: 0,
          format: 'decimal',
          text: '%1.',
          alignment: 'start',
          style: {
            paragraph: {
              indent: { left: 720, hanging: 360 }
            }
          }
        }]
      }]
    },
    sections: [{
      properties: {},
      children
    }]
  });

  // 生成文档
  const buffer = await Packer.toBuffer(doc);
  
  // 创建 Blob
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
};

// 下载文件
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // 触发下载
  document.body.appendChild(a);
  a.click();
  
  // 清理
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}; 