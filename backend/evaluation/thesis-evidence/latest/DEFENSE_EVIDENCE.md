# OpenEdu 论文实验与答辩证据包

生成时间：2026-07-29T12:14:14.481Z

## 可直接陈述的结果

- 工程回归数据集共 210 条，其中单轮 196 条、多轮上下文 14 条。
- 关键词基线 Accuracy 为 20.41%，Macro-F1 为 15.39%。
- OpenEdu 意图分类器 Accuracy 为 100.00%，Macro-F1 为 100.00%。
- 上下文解析器在 14 条工程回归样例上的 Accuracy 为 100.00%。
- 自动化验证通过 6/6 项。

## 证据文件

| 证据 | 用途 |
|---|---|
| experiment-observations.csv | 每个样例、方法、预测与正确性，支持复核和重新统计 |
| model-comparison.csv | 论文主结果表 |
| per-intent-metrics.csv | 各意图 Precision、Recall、F1 |
| language-breakdown.csv | 中文、英文、俄文分组表现 |
| confusion-matrix-long.csv | 混淆矩阵原始长表 |
| business-validation.csv | 权限、状态机、API 和端到端流程验证 |
| model-comparison.svg | 可直接放入答辩的对比图 |
| experiment-summary.json | 机器可读汇总与研究限制 |
| evidence-manifest.json | 文件哈希，证明证据包完整性 |

## 学术边界

当前数据集是参与过规则迭代的版本化工程回归集，因此不能被描述为独立泛化测试。论文最终结论还需要冻结代码后，使用未参与开发的人工标注留出集进行一次性评测。当前证据能够支持“系统实现正确、工程改进有效、业务流程可重复验证”，但不能单独支持对未知真实用户问题的最终泛化结论。

## 答辩建议

先展示 model-comparison.svg，再展示 language-breakdown.csv 和 business-validation.csv。被问到 100% 准确率时，应主动说明这是工程回归结果，并展示上述学术边界，而不是把它表述为真实场景最终准确率。
