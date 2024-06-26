import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Tooltip,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Row,
  Col,
  Slider,
  Progress,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { format } from "date-fns";
import { createProject, deleteProject, editProject, getEmployees, getProjects } from "../../../api/company";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Project {
  _id: string;
  name: string;
  description: string;
  status: "Not Started" | "In Progress" | "Completed";
  progress: number;
  priority: "Low" | "Medium" | "High";
  startDate: Date;
  endDate: Date;
  assignedPerson: Employee;
}

interface Employee {
  _id: string;
  name: string;
}

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      if (response.status === 200) {
        setEmployees(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch employees");
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      console.log("response:", response);
      setProjects(response.data);
    } catch (error) {
      message.error("Failed to fetch projects");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  const columns = [
    {
      title: "Project Name",
      dataIndex: "name",
      key: "name",
      width: "15%",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: "20%",
      render: (text: string) => (
        <Tooltip title={text}>
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "10%",
      render: (status: string) => (
        <Tag
          color={
            status === "Completed"
              ? "green"
              : status === "In Progress"
              ? "blue"
              : "orange"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      width: "10%",
      render: (progress: number) => `${progress}%`,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: "10%",
      render: (priority: string) => (
        <Tag
          color={
            priority === "High"
              ? "red"
              : priority === "Medium"
              ? "yellow"
              : "green"
          }
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      width: "15%",
      render: (_: any, record: Project) => (
        <div>
          <div>Start: {format(new Date(record.startDate), "PP")}</div>
          <div>End: {format(new Date(record.endDate), "PP")}</div>
        </div>
      ),
    },
    {
      title: "Assigned",
      dataIndex: "assignedPerson",
      key: "assignedPerson",
      width: "10%",
      render: (assignedPerson: any) =>
        assignedPerson?.name || "Not Assigned",
    },
    {
      title: "Actions",
      key: "actions",
      width: "10%",
      render: (_: any, record: Project) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="View More">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewMore(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      priority: project.priority,
      status: project.status,
      progress: project.progress,
      startDate: moment(project.startDate), // Ensure proper moment formatting
      endDate: moment(project.endDate), // Ensure proper moment formatting
      assignedPerson: project.assignedPerson._id, // Use _id for Select component
    });
    setIsEditModalVisible(true);
  };

  const handleViewMore = (project: Project) => {
    setSelectedProject(project);
    setIsViewModalVisible(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalVisible(true);
  };

  const handleAdd = () => {
    setIsAddModalVisible(true);
  };

  const handleAddOk = async (values: any) => {
    const newProject: Project = {
      ...values,
      id: `${projects.length + 1}`,
      startDate: new Date(values.startDate.format("YYYY-MM-DD")), // Convert to string
      endDate: new Date(values.endDate.format("YYYY-MM-DD")), // Convert to string
    };
    try {
      const response = await createProject(newProject);
      setProjects([response.data, ...projects]);
      setIsAddModalVisible(false);
      message.success("Project created successfully!");
    } catch (error) {
      message.error("Failed to create project!");
    }
  };

  const handleEditOk = async (values: any) => {
    if (!selectedProject?._id) {
      message.error("Punable to edit project.");
      return;
    }
    const updatedProject: Project = {
      ...values,
      _id: selectedProject._id,
      startDate: new Date(values.startDate.format("YYYY-MM-DD")), // Convert to string
      endDate: new Date(values.endDate.format("YYYY-MM-DD")), // Convert to string
    }
    try {
      await editProject(selectedProject._id, updatedProject);
      const updatedProjects = projects.map((project) =>
        project._id === selectedProject._id ? updatedProject : project
      );
      setProjects(updatedProjects);
      setIsEditModalVisible(false);
      message.success("Project edited successfully!");
    } catch (error) {
      message.error("Failed to edit project!");
    }
  };

  const handleCancel = () => {
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    setIsViewModalVisible(false);
    setIsDeleteModalVisible(false);
  };

  const handleDeleteOk = async() => {
    if (!selectedProject?._id) {
      message.error("unable to delete project.");
      return;
    }
    try {
      await deleteProject(selectedProject._id)
      setProjects(
        projects.filter((project) => project._id !== selectedProject?._id)
      );
      setIsDeleteModalVisible(false);
    } catch (error) {
      message.error("Failed to delete project!");
    }
    
  };

  return (
    <div>
      <Row justify="space-between">
        <Col>
          <Title level={2}>Project List</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Project
          </Button>
        </Col>
      </Row>
      <Table columns={columns} dataSource={projects} rowKey="id" />

      <Modal
        title="Add Project"
        open={isAddModalVisible}
        onCancel={handleCancel}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              form.resetFields();
              handleAddOk(values);
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Project Name"
            rules={[
              { required: true, message: "Please input the project name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <TextArea />
          </Form.Item>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[
              { required: true, message: "Please select the priority!" },
            ]}
          >
            <Select placeholder="Select project priority">
              <Option value="Low">Low</Option>
              <Option value="Medium">Medium</Option>
              <Option value="High">High</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[
                  { required: true, message: "Please select the start date!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[
                  { required: true, message: "Please select the end date!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="assignedPerson"
            label="Assigned Person"
            rules={[
              { required: true, message: "Please select the assigned person!" },
            ]}
          >
            <Select placeholder="Select an employee">
              {employees.map((employee) => (
                <Option key={employee._id} value={employee._id}>
                  {employee.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Project"
        open={isEditModalVisible}
        onCancel={handleCancel}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              form.resetFields();
              handleEditOk(values);
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Project Name"
            rules={[
              { required: true, message: "Please input the project name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <TextArea />
          </Form.Item>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[
              { required: true, message: "Please select the priority!" },
            ]}
          >
            <Select>
              <Option value="Low">Low</Option>
              <Option value="Medium">Medium</Option>
              <Option value="High">High</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[
              { required: true, message: "Please select the status!" },
            ]}
          >
            <Select>
              <Option value="Not Started">Not Started</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="progress"
            label="Progress"
            rules={[
              { required: true, message: "Please input the progress!" },
            ]}
          >
            <Slider min={0} max={100} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[
                  { required: true, message: "Please select the start date!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[
                  { required: true, message: "Please select the end date!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="assignedPerson"
            label="Assigned Person"
            rules={[
              { required: true, message: "Please select the assigned person!" },
            ]}
          >
            <Select>
              {employees.map((employee) => (
                <Option key={employee._id} value={employee._id}>
                  {employee.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="View Project"
        open={isViewModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {selectedProject && (
          <div>
            <p>
              <strong>Project Name:</strong> {selectedProject.name}
            </p>
            <p>
              <strong>Description:</strong> {selectedProject.description}
            </p>
            <p>
              <strong>Priority:</strong> {selectedProject.priority}
            </p>
            <p>
              <strong>Status:</strong> {selectedProject.status}
            </p>
            <p>
              <strong>Progress:</strong> {selectedProject.progress}%
            </p>
            <p>
              <strong>Start Date:</strong>{" "}
              {format(new Date(selectedProject.startDate), "PP")}
            </p>
            <p>
              <strong>End Date:</strong>{" "}
              {format(new Date(selectedProject.endDate), "PP")}
            </p>
            <p>
              <strong>Assigned Person:</strong>{" "}
              {selectedProject.assignedPerson.name}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        title="Delete Project"
        open={isDeleteModalVisible}
        onCancel={handleCancel}
        onOk={handleDeleteOk}
      >
        <p>Are you sure you want to delete this project?</p>
      </Modal>
    </div>
  );
};

export default ProjectList;
