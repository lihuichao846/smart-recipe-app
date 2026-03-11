import { addDays } from 'date-fns';

export function estimateExpiryDate(name: string): Date {
  const lowerName = name.toLowerCase();
  
  // 海鲜/水产 (1-2天) - 最易腐坏
  if (/(虾|蟹|鱼|贝|蛤|蚝|鱿鱼|章鱼|海鲜)/.test(lowerName)) {
    return addDays(new Date(), 1);
  }

  // 熟食/剩菜 (1-2天)
  if (/(剩|熟|饭|面|饺子|包子|馒头|烧烤|卤味)/.test(lowerName)) {
    return addDays(new Date(), 1);
  }

  // 浆果/软水果 (2-3天)
  if (/(草莓|蓝莓|桑葚|杨梅|樱桃|葡萄|桃|李|杏)/.test(lowerName)) {
    return addDays(new Date(), 2);
  }

  // 豆制品 (2-3天)
  if (/(豆腐|豆浆|豆皮|腐竹|豆干)/.test(lowerName)) {
    return addDays(new Date(), 2);
  }

  // 蛋类/芝士/黄油 (21-30天)
  if (/(蛋|芝士|黄油|奶酪)/.test(lowerName)) {
    if (/(蛋)/.test(lowerName)) return addDays(new Date(), 21);
    return addDays(new Date(), 30);
  }

  // 生肉/禽肉 (2-3天)
  if (/(肉|猪|牛|羊|鸡|鸭|排骨)/.test(lowerName)) {
    // 绞肉/肉末更容易变质
    if (/(末|碎|绞|馅)/.test(lowerName)) return addDays(new Date(), 1);
    return addDays(new Date(), 2);
  }

  // 菌菇类 (3-5天)
  if (/(菇|蘑菇|金针菇|香菇|木耳)/.test(lowerName)) {
    return addDays(new Date(), 3);
  }

  // 绿叶蔬菜 (3-5天)
  if (/(菜|菠菜|生菜|油麦|青菜|香菜|葱|蒜苗|韭菜|茼蒿|空心菜)/.test(lowerName)) {
    return addDays(new Date(), 3);
  }

  // 鲜奶/酸奶 (5-14天)
  if (/(奶|酸奶|乳)/.test(lowerName)) {
    if (/(鲜奶|巴氏)/.test(lowerName)) return addDays(new Date(), 3);
    if (/(酸奶)/.test(lowerName)) return addDays(new Date(), 10);
    return addDays(new Date(), 5);
  }

  // 瓜果类蔬菜 (5-7天)
  if (/(瓜|黄瓜|苦瓜|丝瓜|冬瓜|南瓜|茄子|番茄|西红柿|椒|豆角)/.test(lowerName)) {
    return addDays(new Date(), 5);
  }

  // 耐储水果 (7-14天)
  if (/(苹果|梨|柑|橘|橙|柚|柠檬|香蕉)/.test(lowerName)) {
    return addDays(new Date(), 10);
  }

  // 根茎类蔬菜 (10-14天)
  if (/(土豆|洋葱|胡萝卜|萝卜|红薯|山药|姜|蒜头|芋头)/.test(lowerName)) {
    return addDays(new Date(), 14);
  }
  
  // 调味品/酱料 (30天+)
  if (/(酱|醋|油|盐|糖|蜜|调料|咸菜)/.test(lowerName)) {
    return addDays(new Date(), 30);
  }
  
  // 饮料 (7-30天)
  if (/(汁|酒|水|饮)/.test(lowerName)) {
    return addDays(new Date(), 7);
  }

  // 默认 (5天) - 采取相对保守的估计
  return addDays(new Date(), 5);
}
