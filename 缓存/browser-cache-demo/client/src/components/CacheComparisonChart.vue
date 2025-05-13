<template>
  <div class="chart-container">
    <h3>缓存策略性能比较</h3>
    
    <div class="chart">
      <div class="chart-row" v-for="(item, index) in chartData" :key="index">
        <div class="chart-label">{{ item.label }}</div>
        <div class="chart-bar-container">
          <div 
            class="chart-bar" 
            :style="{ 
              width: calculateWidth(item.value) + '%',
              backgroundColor: getBarColor(index)
            }"
          >
            <span class="chart-value">{{ item.value }}ms</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chart-legend">
      <div class="legend-item" v-for="(item, index) in chartData" :key="index">
        <div class="legend-color" :style="{ backgroundColor: getBarColor(index) }"></div>
        <div class="legend-label">{{ item.label }}</div>
      </div>
    </div>
    
    <div class="chart-notes" v-if="notes && notes.length">
      <h4>分析说明：</h4>
      <ul>
        <li v-for="(note, index) in notes" :key="index">{{ note }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CacheComparisonChart',
  props: {
    chartData: {
      type: Array,
      required: true
    },
    notes: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    calculateWidth(value) {
      const maxValue = Math.max(...this.chartData.map(item => item.value));
      return (value / maxValue) * 85; // 最大宽度85%
    },
    getBarColor(index) {
      // 预定义的颜色数组
      const colors = [
        '#3498db', // 蓝色
        '#2ecc71', // 绿色
        '#e74c3c', // 红色
        '#f39c12', // 橙色
        '#9b59b6', // 紫色
        '#1abc9c', // 青绿色
        '#34495e'  // 深蓝色
      ];
      
      return colors[index % colors.length];
    }
  }
};
</script>

<style scoped>
.chart-container {
  margin: 20px 0;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chart-container h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.2rem;
}

.chart {
  margin-bottom: 20px;
}

.chart-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.chart-label {
  width: 120px;
  font-size: 0.9rem;
  color: #555;
  text-align: right;
  padding-right: 15px;
}

.chart-bar-container {
  flex: 1;
  height: 25px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.chart-value {
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  margin-bottom: 10px;
}

.legend-color {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  margin-right: 5px;
}

.legend-label {
  font-size: 0.85rem;
  color: #666;
}

.chart-notes {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  margin-top: 10px;
}

.chart-notes h4 {
  font-size: 1rem;
  margin-bottom: 10px;
  color: #555;
}

.chart-notes ul {
  padding-left: 20px;
}

.chart-notes li {
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #666;
}
</style> 