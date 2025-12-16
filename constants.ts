import { NewsType, NewsItem } from './types';

export const DEFAULT_BRANDS = [
  "Toyota", "Nissan", "Ford", "BMW", "Mercedes", 
  "Changan", "BYD", "Geely", "Jetour", "Tesla", "MG"
];

export const NEWS_TYPES_LIST = [
  NewsType.LAUNCH,
  NewsType.POLICY,
  NewsType.SALES,
  NewsType.PERSONNEL,
  NewsType.COMPETITOR,
  NewsType.OTHER
];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  [NewsType.LAUNCH]: "新车上市",
  [NewsType.POLICY]: "政策法规",
  [NewsType.SALES]: "市场销量",
  [NewsType.PERSONNEL]: "人事变动",
  [NewsType.COMPETITOR]: "竞品动态",
  [NewsType.OTHER]: "其他"
};

// Helper to generate a random ID
const uuid = () => Math.random().toString(36).substring(2, 15);

// Initial Demo Data
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getAIImage = (prompt: string) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random()*1000)}`;

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: uuid(),
    date: formatDate(today),
    title: "比亚迪在迪拜开设新旗舰店，扩大市场份额",
    summary: "比亚迪在谢赫扎耶德路正式开设了中东地区最大的展厅。活动重点介绍了针对高温环境优化的新款海豹车型的发布。",
    type: NewsType.LAUNCH,
    brand: "BYD",
    source: "Auto Daily UAE",
    image: getAIImage("BYD modern car showroom dubai luxury exterior sunny"),
    url: "#"
  },
  {
    id: uuid(),
    date: formatDate(new Date(today.getTime() - 86400000 * 2)),
    title: "丰田主要中东市场混合动力销量增长15%",
    summary: "季度报告显示，受燃油效率关注和新政府激励措施的推动，阿联酋市场消费者对混合动力汽车的偏好发生显著转变。",
    type: NewsType.SALES,
    brand: "Toyota",
    source: "Market Watch",
    image: getAIImage("Toyota hybrid suv driving in dubai desert road"),
    url: "#"
  },
  {
    id: uuid(),
    date: formatDate(new Date(today.getTime() - 86400000 * 5)),
    title: "阿布扎比宣布新的电动汽车基础设施法规",
    summary: "能源部发布了住宅电动汽车充电器安装的新指南，旨在简化别墅业主的审批流程。",
    type: NewsType.POLICY,
    brand: "Tesla",
    source: "Gov News",
    image: getAIImage("electric vehicle charging station modern abu dhabi"),
    url: "#"
  },
  {
    id: uuid(),
    date: formatDate(new Date(today.getTime() - 86400000 * 8)),
    title: "长安 Uni-K 评测：SUV 市场的有力竞争者",
    summary: "当地汽车记者称赞长安 Uni-K 的未来感设计和高档内饰，但也指出面临来自老牌韩国品牌的激烈竞争。",
    type: NewsType.COMPETITOR,
    brand: "Changan",
    source: "Drive Arabia",
    image: getAIImage("Changan Uni-K silver suv cinematic shot"),
    url: "#"
  }
];