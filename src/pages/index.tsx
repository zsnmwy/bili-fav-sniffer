import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import {Button, Form, Input, message, Modal, Upload, Popover, Drawer} from 'antd';
import React, {useEffect, useState} from 'react';
import {ConnectionType, EasterEgg} from '@/const';
import type {UploadProps} from 'antd';
import {SettingOutlined} from '@ant-design/icons';

const {TextArea} = Input;

const layout = {
    labelCol: {span: 6},
};

const tailLayout = {
    wrapperCol: {offset: 6, span: 16},
};

export default function Home() {
    const [form] = Form.useForm();
    const [formData, setFormData] = useState({});
    const [nextInvocationTime, setInvocationTime] = useState('');
    const [cookiesVisible, setCookiesVisible] = useState(false); // 控制模态框的显示与隐藏
    const [logVisible, setLogVisible] = useState(false); // 控制模态框的显示与隐藏
    const [cookiesText, setCookiesText] = useState(''); // 保存 TextArea 中的文本内容
    const [runningLog, setRunningLog] = useState(''); // 保存 TextArea 中的文本内容
    const [validateChatIDStatus, setValidateChatIDStatus] = useState('');
    const [validateRSSStatus, setValidateRSSStatus] = useState('');
    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        // 从 API 获取数据
        console.log(
            "\n" +
            " %c Built by 六只鱼® %c https://github.com/BarryLiu1995 " +
            "\n",
            "color: #fadfa3; background: #030307; padding:5px 0; font-size:18px;",
            "background: #fadfa3; padding:5px 0; font-size:18px;"
        );
        console.log(EasterEgg)
        fetch('/api/config')
            .then(response => response.json())
            .then(data => {
                setFormData(data.data);
            })
            .catch(error => console.error(error));
        fetch('/api/job')
            .then(response => response.json())
            .then(data => {
                setInvocationTime(data?.data.nextInvocationTime);
            })
            .catch(error => console.error(error));
    }, []);

    useEffect(() => {
        const {fid, uid} = formData as any;
        form.setFieldsValue({
            fav_url: uid && fid ? `https://space.bilibili.com/${uid}/favlist?fid=${fid}&ftype=create` : '',
            ...formData
        });
    }, [formData, form]);

    const onSubmit = async (values: any) => {
        try {
            const response = await fetch('/api/job', {
                method: 'POST',
                body: JSON.stringify(values),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            });
            if (!response.ok) {
                throw Error(response.statusText)
            }
            const data = await response.json();
            setInvocationTime(data.data.nextInvocationTime);
            message.success(data.msg);
        } catch (error) {
            message.error(`${error}`);
            console.error(error);
        }
    };

    const onTerminate = async () => {
        try {
            const response = await fetch('/api/job', {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw Error(response.statusText)
            }
            const data = await response.json();
            setInvocationTime(data.data.nextInvocationTime);
            message.success(data.msg);
        } catch (error) {
            message.error(`${error}`);
            console.error(error);
        }
    }

    const showModal = () => {
        setCookiesVisible(true);
    };

    const showLog = () => {
        setLogVisible(true);
    }
    const handleOk = async () => {
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                body: JSON.stringify({cookies: cookiesText}),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            });
            if (!response.ok) {
                throw Error(response.statusText)
            }
            const data = await response.json();
            message.success(data.msg);
        } catch (error) {
            message.error(`${error}`);
            console.error(error);
        } finally {
            setCookiesVisible(false);
        }
    };

    const handleCancel = () => {
        setCookiesVisible(false);
    };

    const handleCookiesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCookiesText(e.target.value);
    };

    const onCallOnce = async () => {
        try {
            const response = await fetch('/api/job', {
                method: 'PUT'
            });
            if (!response.ok) {
                throw Error(response.statusText)
            }
            const data = await response.json();
            message.success(data.msg);
        } catch (error) {
            message.error(`${error}`);
            console.error(error);
        }
    }

    const props: UploadProps = {
        name: 'file',
        action: '/api/upload',
        accept: ".json",
        showUploadList: false,
        onChange(info) {
            if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList);
            }
            if (info.file.status === 'done') {
                message.success(`${info.file.name} 文件成功上传`);
                setFormData((info.file.response as any).data);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} 文件上传失败`);
            }
        },
    };

    const exportConfig = async () => {
        try {
            const res = await fetch('/api/export')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'config.json' // 设置下载文件名
            link.click()
        } catch (error) {
            console.error(error)
        }
    }

    const handleChatIDBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
        const telegram_bot_token = form.getFieldValue('telegram_bot_token');
        if (!telegram_bot_token || !event.target.value) {
            return;
        }
        setValidateChatIDStatus('validating');
        try {
            const response = await fetch(`/api/connection`, {
                method: 'POST',
                body: JSON.stringify({
                    type: ConnectionType.Tele,
                    telegram_bot_token,
                    telegram_chat_id: event.target.value,
                }),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            });
            if (response.ok) {
                setValidateChatIDStatus('success');// 在这里处理测试成功的逻辑
            } else {
                throw new Error(response.statusText)
            }
        } catch (e) {
            console.error(e);
            setValidateChatIDStatus('error');
        }
    };

    const handleRSSDomainBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
        if (!event.target.value) {
            return;
        }
        setValidateRSSStatus('validating');
        try {
            const resp = await fetch('/api/connection', {
                method: 'POST',
                body: JSON.stringify({
                    type: ConnectionType.RSS,
                    url: event.target.value,
                }),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            });
            if (resp.ok) {
                setValidateRSSStatus('success');
            } else {
                throw new Error(resp.statusText);
            }
        } catch (e) {
            setValidateRSSStatus('error');
            console.error(e);
        }
    };

    return (
        <>
            <Head>
                <title>bili-fav-sniffer 配置</title>
                <meta name="description" content="Generated by create next app"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <main className={styles.main}>
                <Popover placement="leftTop" content={'配置管理'}>
                    <Button
                        className={styles.setting}
                        type="text"
                        ghost
                        icon={<SettingOutlined style={{fontSize: '16px'}}/>}
                        onClick={showDrawer}

                    />
                </Popover>
                <Drawer title="配置管理" placement="right" onClose={onClose} open={open}>
                    <Upload {...props} >
                        <Button className={styles.reset}>导入配置</Button>
                    </Upload>
                    <Button onClick={exportConfig} className={styles.reset} disabled={!nextInvocationTime}>
                        导出配置
                    </Button>
                </Drawer>
                <Modal
                    open={cookiesVisible}
                    mask={true}
                    closable={false}
                    footer={[
                        <Button key="back" onClick={handleCancel}>
                            取消
                        </Button>,
                        <Button key="submit" type="primary" onClick={handleOk} disabled={!cookiesText.trim()}>
                            确认
                        </Button>,
                    ]}
                >
                    <TextArea rows={8} onChange={handleCookiesChange}
                              placeholder="针对会员用户可以下载最高清晰度的视频，数据仅在本地，请放心使用～"/>
                </Modal>
                <Modal
                    open={logVisible}
                    mask={true}
                    closable={true}
                    title="日志"
                    centered
                    width={1000}
                    footer={null}
                >
                    <TextArea style={{backgroundColor: '#020202'}} rows={30} value={runningLog} readOnly/>
                </Modal>
                <div className={styles.container}>
                    <Form
                        {...layout}
                        form={form}
                        name="control-hooks"
                        initialValues={{rss_domain: 'https://rsshub.app', cron: '0 10,19 * * *'}}
                        onFinish={onSubmit}
                        className={styles.form}
                    >
                        <Form.Item
                            label="TG 推送"
                            style={{marginBottom: 0}}
                            tooltip={<span>查阅<a target="_blank" style={{textDecoration: "underline"}}
                                                  href="https://hellodk.cn/post/743">Telegram 创建 bot 获取 token 和 chatID 以及发送消息简明教程</a></span>}
                        >
                            <Form.Item
                                name="telegram_bot_token"
                                style={{display: 'inline-block', width: 'calc(50% - 8px)'}}
                            >
                                <Input placeholder="请输入 TG token"/>
                            </Form.Item>
                            <Form.Item
                                name="telegram_chat_id"
                                style={{display: 'inline-block', width: '50%', margin: '0 0 0 8px'}}
                                hasFeedback
                                validateStatus={validateChatIDStatus as ""}
                            >
                                <Input placeholder="请输入 TG chat id" onBlur={handleChatIDBlur}/>
                            </Form.Item>
                        </Form.Item>
                        <Form.Item
                            label="收藏夹"
                            name="fav_url"
                            rules={[
                                {
                                    required: true,
                                    message: '请输入收藏夹链接'
                                },
                                {
                                    pattern: new RegExp('^https?:\\/\\/space\\.bilibili\\.com\\/.+?\\/favlist\\?fid=.+?$'),
                                    message: '请输入正确的收藏夹地址'
                                }
                            ]}
                            tooltip={<span>查阅<a target="_blank" style={{textDecoration: "underline"}}
                                                  href="https://docs.rsshub.app/social-media.html#bilibili-up-zhu-fei-mo-ren-shou-cang-jia">社交媒体-bilibili up主非默认收藏夹｜RSSHub</a></span>}>
                            <Input placeholder="请输入收藏夹 URL"/>
                        </Form.Item>
                        <Form.Item
                            name="rss_domain"
                            label="RSSHub 服务"
                            hasFeedback
                            validateStatus={validateRSSStatus as ""}
                            rules={[
                                {
                                    required: true,
                                    message: '请输入 RssHub 服务地址'
                                },
                                {
                                    pattern: new RegExp('^(http|https):\\/\\/[^\\s/$.?#].[^\\s]*[^/]$'),
                                    message: '请输入符合的地址，注意不要以 / 结尾'
                                }
                            ]}>
                            <Input onBlur={handleRSSDomainBlur}/>
                        </Form.Item>
                        <Form.Item name="cron" label="Cron 定时" rules={[{required: true}]}>
                            <Input/>
                        </Form.Item>
                        <Form.Item label="Cookies">
                            <Input
                                style={{cursor: 'pointer'}}
                                onClick={showModal}
                                readOnly
                                placeholder="点击输入 cookies 值"
                            />
                        </Form.Item>
                        <Form.Item label="下次执行时间">
                            <span>{nextInvocationTime ? new Date(nextInvocationTime).toLocaleString() : '暂未有任务运行中'}</span>
                        </Form.Item>
                        <Form.Item {...tailLayout} className={styles.buttons}>
                            <Button type="primary" htmlType="submit">
                                {`${nextInvocationTime ? '更新' : '开启'}任务`}
                            </Button>
                            <Button htmlType="button" onClick={onTerminate} className={styles.reset}
                                    disabled={!nextInvocationTime}>
                                结束任务
                            </Button>
                            <Button htmlType="button" onClick={onCallOnce} className={styles.reset}
                                    disabled={!nextInvocationTime}>
                                手动执行
                            </Button>
                        </Form.Item>
                        {/* <Form.Item {...tailLayout} className={styles.buttons}>
                            <Button type="link" onClick={showLog}>
                                查看日志
                            </Button>
                        </Form.Item> */}
                    </Form>
                </div>
            </main>
        </>
    )
}
